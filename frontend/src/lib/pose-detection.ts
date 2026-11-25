"use client";

import {useEffect, useRef, useState} from "react";
import type {PoseLandmarker, PoseLandmarkerResult} from "@mediapipe/tasks-vision";

export type PoseMetrics = {angle: number | null; repetitions: number; phase: "waiting" | "flexed" | "extended"; confidence: number};

const connections = [[0,11],[0,12],[11,12],[11,13],[13,15],[15,17],[15,19],[15,21],[12,14],[14,16],[16,18],[16,20],[16,22],[11,23],[12,24],[23,24],[23,25],[25,27],[27,29],[27,31],[24,26],[26,28],[28,30],[28,32]] as const;
const pointConfidence = (point: {visibility?: number; presence?: number}) => Math.min(point.visibility ?? 1, point.presence ?? 1);

function elbowAngle(a: {x:number;y:number}, b: {x:number;y:number}, c: {x:number;y:number}) {
  const v1 = {x:a.x-b.x,y:a.y-b.y}; const v2 = {x:c.x-b.x,y:c.y-b.y};
  const cosine = (v1.x*v2.x+v1.y*v2.y)/(Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y));
  return Math.round(Math.acos(Math.max(-1,Math.min(1,cosine)))*180/Math.PI);
}

function paint(canvas: HTMLCanvasElement, video: HTMLVideoElement, result: PoseLandmarkerResult) {
  const rect = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(rect.width*dpr) || canvas.height !== Math.round(rect.height*dpr)) { canvas.width = Math.round(rect.width*dpr); canvas.height = Math.round(rect.height*dpr); }
  const ctx = canvas.getContext("2d"); if (!ctx) return;
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,rect.width,rect.height);
  const pose = result.landmarks[0]; if (!pose || !video.videoWidth || !video.videoHeight) return;
  const scale = Math.max(rect.width/video.videoWidth,rect.height/video.videoHeight);
  const offsetX=(rect.width-video.videoWidth*scale)/2, offsetY=(rect.height-video.videoHeight*scale)/2;
  const xy=(i:number)=>({x:pose[i].x*video.videoWidth*scale+offsetX,y:pose[i].y*video.videoHeight*scale+offsetY});
  ctx.lineWidth=4; ctx.lineCap="round"; ctx.strokeStyle="#36e0b0"; ctx.shadowColor="#36e0b0"; ctx.shadowBlur=10;
  for(const [a,b] of connections) if(pointConfidence(pose[a])>.35&&pointConfidence(pose[b])>.35){const p=xy(a),q=xy(b);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
  ctx.shadowBlur=8; ctx.fillStyle="#ffffff";
  pose.forEach((point,i)=>{if(pointConfidence(point)>.35){const p=xy(i);ctx.beginPath();ctx.arc(p.x,p.y,[11,12,23,24].includes(i)?6:4,0,Math.PI*2);ctx.fill();}});
}

export function usePoseDetection(videoRef: React.RefObject<HTMLVideoElement | null>, canvasRef: React.RefObject<HTMLCanvasElement | null>, enabled: boolean) {
  const [metrics,setMetrics]=useState<PoseMetrics>({angle:null,repetitions:0,phase:"waiting",confidence:0});
  const [modelState,setModelState]=useState<"loading"|"ready"|"error">("loading");
  const reps=useRef(0); const flexed=useRef(false); const lastRep=useRef(0); const lastVideoTime=useRef(-1);
  useEffect(()=>{
    if(!enabled) return;
    let cancelled=false; let frame=0; let landmarker:PoseLandmarker|undefined; let lastUi=0;
    setModelState("loading");
    const loop=()=>{
      if(cancelled) return;
      const video=videoRef.current, canvas=canvasRef.current;
      if(video&&canvas&&video.readyState>=2&&video.currentTime!==lastVideoTime.current){
        lastVideoTime.current=video.currentTime;
        try {
          const result=landmarker?.detectForVideo(video,performance.now());
          if(result){paint(canvas,video,result); const pose=result.landmarks[0];
            if(pose){
              const left=[11,13,15],right=[12,14,16];
              const score=(ids:number[])=>ids.reduce((sum,id)=>sum+pointConfidence(pose[id]),0)/3;
              const side=score(left)>=score(right)?left:right; const confidence=score(side);
              const angle=confidence>.4?elbowAngle(pose[side[0]],pose[side[1]],pose[side[2]]):null;
              let phase:PoseMetrics["phase"]="waiting";
              if(angle!==null){
                if(angle<115){flexed.current=true;phase="flexed";} else if(angle>155){phase="extended";if(flexed.current&&performance.now()-lastRep.current>800){reps.current+=1;lastRep.current=performance.now();flexed.current=false;}} else phase=flexed.current?"flexed":"extended";
                if(performance.now()-lastUi>250){lastUi=performance.now();setMetrics({angle,repetitions:reps.current,phase,confidence});}
              } else if(performance.now()-lastUi>500){lastUi=performance.now();setMetrics({angle:null,repetitions:reps.current,phase:"waiting",confidence});}
            } else if(performance.now()-lastUi>500){lastUi=performance.now();setMetrics({angle:null,repetitions:reps.current,phase:"waiting",confidence:0});}
          }
        } catch { /* Skip a bad frame and continue with the next one. */ }
      }
      frame=requestAnimationFrame(loop);
    };
    async function initialize(){
      try {
        const {FilesetResolver,PoseLandmarker}=await import("@mediapipe/tasks-vision");
        const files=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm");
        const options={baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",delegate:"GPU" as const},runningMode:"VIDEO" as const,numPoses:1};
        try{landmarker=await PoseLandmarker.createFromOptions(files,options);}catch{landmarker=await PoseLandmarker.createFromOptions(files,{...options,baseOptions:{...options.baseOptions,delegate:"CPU"}});}
        if(!cancelled) {setModelState("ready");frame=requestAnimationFrame(loop);} else landmarker.close();
      } catch { if(!cancelled){setModelState("error");setMetrics((value)=>({...value,angle:null,phase:"waiting",confidence:0}));} }
    }
    void initialize();
    return()=>{cancelled=true;cancelAnimationFrame(frame);landmarker?.close();const ctx=canvasRef.current?.getContext("2d");if(ctx&&canvasRef.current)ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);};
  },[enabled,videoRef,canvasRef]);
  return {...metrics,modelState};
}
