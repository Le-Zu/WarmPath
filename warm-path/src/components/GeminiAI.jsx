import { GoogleGenAI } from '@google/genai';
import { useState } from 'react';

export default function GeminiAI() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const ai = new GoogleGenAI({apiKey});

    async function warmth_score(){
        const response = ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "Make a assessment on a scale from 1-5 how relevant these two prompts are to each other. prompt 1: Tina Morales is a senior studying Psychology with a focus on cognitive bias in UX. She interned at IDEO doing user research and testing. Shared interests: design systems, product UX. prompt 2: Grace Liu is a senior CS major specialising in full-stack development. Interned at Stripe and does freelance React work. Interested in frontend internships and design-engineering overlap. respond only with a number from 1 to 5."
        })
        console.log((await response).text);
    }
}

