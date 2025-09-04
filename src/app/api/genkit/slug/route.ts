import {createGenkitNextHandler} from '@genkit-ai/next';
import '@/ai/dev'; // This will register all the defined flows.

export const {GET, POST} = createGenkitNextHandler();
