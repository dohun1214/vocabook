import textToSpeech from '@google-cloud/text-to-speech';

const client = new textToSpeech.TextToSpeechClient({
  apiKey: process.env.GOOGLE_TTS_API_KEY,
});

export async function synthesize(text: string, languageCode = 'en-US'): Promise<string> {
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode,
      ssmlGender: 'FEMALE' as const,
      name: 'en-US-Neural2-C',
    },
    audioConfig: { audioEncoding: 'MP3' as const },
  });

  const audioContent = response.audioContent;
  if (!audioContent) throw new Error('No audio content returned from TTS');

  return Buffer.from(audioContent as Uint8Array).toString('base64');
}
