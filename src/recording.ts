export async function toWav(recording: Blob): Promise<Blob> {
  if (recording.size > 12_000_000) throw new Error('Выберите аудиофайл до 12 МБ.');
  const decoder = new OfflineAudioContext(1, 1, 16000);
  const buffer = await decoder.decodeAudioData(await recording.arrayBuffer()).catch(() => {
    throw new Error('Браузер не смог прочитать файл. Попробуйте MP3, WAV или M4A.');
  });
  if (buffer.duration > 60) throw new Error('Запишите ответ длительностью до одной минуты.');
  const wav = new DataView(new ArrayBuffer(44 + buffer.length * 2));
  const tag = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) wav.setUint8(offset + i, text.charCodeAt(i));
  };
  tag(0, 'RIFF');
  wav.setUint32(4, wav.byteLength - 8, true);
  tag(8, 'WAVE');
  tag(12, 'fmt ');
  wav.setUint32(16, 16, true);
  wav.setUint16(20, 1, true);
  wav.setUint16(22, 1, true);
  wav.setUint32(24, buffer.sampleRate, true);
  wav.setUint32(28, buffer.sampleRate * 2, true);
  wav.setUint16(32, 2, true);
  wav.setUint16(34, 16, true);
  tag(36, 'data');
  wav.setUint32(40, buffer.length * 2, true);
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, channel) => buffer.getChannelData(channel));
  for (let i = 0; i < buffer.length; i++) {
    const sample = channels.reduce((sum, channel) => sum + channel[i], 0) / channels.length;
    wav.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, sample)) * 32767), true);
  }
  return new Blob([wav.buffer], { type: 'audio/wav' });
}
