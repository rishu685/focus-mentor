import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function testGroq() {
  try {
    console.log('Testing Groq API connection...');
    
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not found in environment variables');
      return;
    }
    
    console.log('API Key found, testing simple request...');
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: "Say 'Hello, World!' in JSON format with a 'message' field."
        }
      ],
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: "json_object" }
    });

    console.log('Response received:');
    console.log(completion.choices[0]?.message?.content);
    
    try {
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      console.log('JSON parsing successful:', parsed);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
    }
    
  } catch (error) {
    console.error('Groq API test failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    console.error('Full error:', error);
  }
}

testGroq().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});