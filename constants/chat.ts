export type ChatMessage = { id: string; role: 'assistant' | 'user'; content: string };
export type Conversation = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export const NEW_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'welcome', role: 'assistant', content: "Hi! I'm your mobile assistant. What would you like to work on today?" },
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: '1', title: 'Trip planning', preview: 'Build a weekend itinerary…', updatedAt: '2m',
    messages: [
      { id: '1-a', role: 'user', content: 'Help me plan a relaxed weekend in Seattle.' },
      { id: '1-b', role: 'assistant', content: 'Absolutely. I can build an itinerary around food, neighborhoods, or outdoor activities. What sounds best?' },
    ],
  },
  {
    id: '2', title: 'Project brainstorm', preview: 'Ideas for the new release…', updatedAt: '1h',
    messages: [
      { id: '2-a', role: 'user', content: 'Can we brainstorm ideas for the new release?' },
      { id: '2-b', role: 'assistant', content: 'Let’s do it. Tell me the audience and the main outcome you want the release to achieve.' },
    ],
  },
  {
    id: '3', title: 'Weekly meal prep', preview: 'A simple grocery list…', updatedAt: 'Tue',
    messages: [
      { id: '3-a', role: 'user', content: 'Create a simple grocery list for weekday meal prep.' },
      { id: '3-b', role: 'assistant', content: 'I can make a flexible five-day plan. Do you have any dietary preferences?' },
    ],
  },
];
