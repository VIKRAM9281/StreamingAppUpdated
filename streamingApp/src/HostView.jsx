import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://192.168.63.113:5000');

const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function HostView({ roomId }) {
  const [peers, setPeers] = useState({});
  const localRef = useRef();

  useEffect(() => {
    socket.emit('join-room', { roomId, role: 'host' });
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localRef.current.srcObject = stream;~
        socket.on('stream-request', ({ id }) => {
          const approve = window.confirm(`Approve stream for ${id}?`);
          if (approve) socket.emit('approve-stream', { roomId, toUserId: id });
        });

        socket.on('signal', async ({ from, data }) => {
          if (!peers[from]) {
            const pc = new RTCPeerConnection(config);
            console.log(pc);
            pc.ontrack = (e) => {
              document.getElementById(`remote-${from}`).srcObject = e.streams[0];
            };
            pc.onicecandidate = (e) => {
              if (e.candidate) socket.emit('signal', { roomId, to: from, from: socket.id, data: { candidate: e.candidate } });
            };
            setPeers((p) => ({ ...p, [from]: pc }));
          }
          if (data.sdp) {
            console.log(data);
            await peers[from].setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await peers[from].createAnswer();
            await peers[from].setLocalDescription(answer);
            socket.emit('signal', { roomId, to: from, from: socket.id, data: { sdp: answer } });
          } else if (data.candidate) {
            await peers[from].addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        });
      });
  }, []);

  return (
    <div>
      <video ref={localRef} autoPlay muted playsInline />
      {Object.keys(peers).map(id => <video id={`remote-${id}`} autoPlay playsInline key={id} />)}
    </div>
  );
}

