import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { RehabSession } from '../sessions/session.entity';

type AssessmentLabel = 'Complete' | 'Incomplete' | 'InsufficientData';
type Assessment = {
  classification: AssessmentLabel;
  summary: string;
  indicators: string[];
  reliability: 'low' | 'medium' | 'high';
  technical_only: true;
};

@Injectable()
export class AiService {
  async analyzeSession(session: RehabSession) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new ServiceUnavailableException('AI is not configured. Set OPENAI_API_KEY in backend/.env.');

    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-6.2-sol';
    const observations = (session.metrics ?? [])
      .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
      .slice(-300)
      .map((metric) => ({
        repetition_count: metric.repetitions,
        elbow_angle_degrees: metric.elbowAngle,
        movement_phase: metric.phase,
        pose_confidence: Number(metric.confidence.toFixed(3)),
      }));

    if (observations.length === 0) {
      return this.insufficient(model, 'Для анализа не сохранены измерения движения.');
    }

    const schema = {
      type: 'object', additionalProperties: false,
      properties: {
        classification: { type: 'string', enum: ['Complete', 'Incomplete', 'InsufficientData'] },
        summary: { type: 'string' },
        indicators: { type: 'array', items: { type: 'string' } },
        reliability: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['classification', 'summary', 'indicators', 'reliability'],
    };

    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          model,
          instructions: [
            'Ты классификатор технических метрик упражнения разгибания локтя, а не медицинский специалист.',
            'Оценивай только переданные числовые метрики. Не диагностируй, не назначай лечение и не делай выводы о здоровье.',
            'Complete означает, что данные содержат достаточные признаки выполненного цикла сгибания и разгибания; Incomplete — что данные явно не показывают завершённый цикл; если временного ряда недостаточно, выбери InsufficientData.',
            'Если в данных только финальные точки повторений без полного временного ряда, reliability должна быть low, а при невозможности обоснованной классификации выбери InsufficientData.',
            'Отвечай по-русски. Возвращай только данные согласно JSON Schema.',
          ].join(' '),
          input: JSON.stringify({
            exercise_id: session.exerciseId,
            recorded_repetitions: session.repetitions,
            duration_seconds: session.durationSeconds,
            average_elbow_angle: session.averageElbowAngle,
            observations,
          }),
          text: { format: { type: 'json_schema', name: 'seriq_exercise_assessment', strict: true, schema } },
          max_output_tokens: 400,
        }),
      });
    } catch {
      throw new BadGatewayException('Could not reach the AI provider. Check backend network access and try again.');
    }

    if (!response.ok) {
      // Keep the provider response and token out of API errors and application logs.
      throw new BadGatewayException(`AI provider returned HTTP ${response.status}. Check the API key, model and account limits.`);
    }
    const payload = await response.json() as {
      output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
    };
    const outputText = payload.output?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === 'output_text')?.text;
    if (!outputText) throw new BadGatewayException('AI provider returned an empty assessment.');

    let assessment: Omit<Assessment, 'technical_only'>;
    try { assessment = JSON.parse(outputText) as Omit<Assessment, 'technical_only'>; }
    catch { throw new BadGatewayException('AI provider returned an invalid assessment format.'); }
    if (!['Complete', 'Incomplete', 'InsufficientData'].includes(assessment.classification)
      || !Array.isArray(assessment.indicators)
      || !['low', 'medium', 'high'].includes(assessment.reliability)) {
      throw new BadGatewayException('AI provider returned an invalid assessment.');
    }
    return { ...assessment, technical_only: true as const, provider: 'openai', model, generated_at: new Date().toISOString() };
  }

  private insufficient(model: string, summary: string) {
    return {
      classification: 'InsufficientData' as const, summary,
      indicators: [], reliability: 'low' as const, technical_only: true as const,
      provider: 'local', model, generated_at: new Date().toISOString(),
    };
  }
}
