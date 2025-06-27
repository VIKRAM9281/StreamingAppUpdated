import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://192.168.63.113:5000');
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function ViewerView({ roomId }) {
  const localRef = useRef();
  const [peers, setPeers] = useState({});

  useEffect(() => {
    socket.emit('join-room', { roomId, role: 'viewer' });
    socket.emit('request-stream', { roomId });

    socket.on('stream-approved', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localRef.current.srcObject = stream;
      for (const peerId of Object.keys(peers)) {
        const pc = new RTCPeerConnection(config);
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit('signal', { roomId, to: peerId, from: socket.id, data: { candidate: e.candidate } });
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('signal', { roomId, to: peerId, from: socket.id, data: { sdp: offer } });
        setPeers((p) => ({ ...p, [peerId]: pc }));
      }
    });

    socket.on('signal', async ({ from, data }) => {
      if (!peers[from]) {
        const pc = new RTCPeerConnection(config);
        pc.ontrack = (e) => {
          document.getElementById(`remote-${from}`).srcObject = e.streams[0];
        };
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit('signal', { roomId, to: from, from: socket.id, data: { candidate: e.candidate } });
        };
        setPeers((p) => ({ ...p, [from]: pc }));
      }
      if (data.sdp) {
        await peers[from].setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peers[from].createAnswer();
        await peers[from].setLocalDescription(answer);
        socket.emit('signal', { roomId, to: from, from: socket.id, data: { sdp: answer } });
      } else if (data.candidate) {
        await peers[from].addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });
  }, []);

  return (
    <div>
      <video ref={localRef} autoPlay muted playsInline />
      {Object.keys(peers).map(id => <video id={`remote-${id}`} autoPlay playsInline key={id} />)}
    </div>
  );
}
