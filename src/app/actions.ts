'use server';

import { naturalLanguageToCode } from '@/ai/flows/natural-language-to-code';
import { z } from 'zod';

const schema = z.object({
  naturalLanguage: z.string().min(10, { message: 'Please provide a more detailed description.' }),
});

export async function generateCodeAction(
  prevState: { yahnuCode: string; error: string | null },
  formData: FormData
) {
  const parseResult = schema.safeParse({
    naturalLanguage: formData.get('naturalLanguage'),
  });

  if (!parseResult.success) {
    return {
      yahnuCode: '',
      error: parseResult.error.errors[0].message,
    };
  }

  try {
    const result = await naturalLanguageToCode({
      naturalLanguage: parseResult.data.naturalLanguage,
    });
    return {
      yahnuCode: result.yahnuCode,
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      yahnuCode: '',
      error: 'Failed to generate code from AI. Please try again.',
    };
  }
}
