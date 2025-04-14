# AI Writing Assistant

A sophisticated AI-powered writing assistant that helps users develop written content through collaborative conversation and structured research.

## 🌟 Features

- Interactive chat-based interface for writing assistance
- Intelligent conversation agent that understands writing needs
- Research capability with knowledge tree generation
- Structured writing approach with customizable templates
- Evaluation system to ensure high-quality responses
- Conversation history saving
- Support for multiple LLM providers (currently OpenAI)

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- OpenAI API key
- TypeScript

### Installation

1. Clone the repository: git clone 
2. Install dependencies:
3. npm
4. 

### Usage

Start the chat: npm run chat
Run tests: npm test

### Project Structure: 

src/
├── cli/                               # Command-line interface
├── config/                            
├── core/                              
│ ├── llm/                             
│ │ ├── agents/                        # Conversation agents
│ │ ├── operators/                     # Operators (control flow)
│ │ └── prompts/                       # System prompts
│ ├── tools/                           
│ │ ├── providers/                     # LLM providers
│ │ ├── research/                      
│ │ └── utils/                         
│ └── types/                           
tests/
├── testingAgent.ts                    # Testing agent implementation
├── qualitative/                       # Qualitative tests
│ └── quantumImmortality.test.ts
└── prompts/                           # Test prompts
├── conversationQualityTest.yaml
└── responseQualityTest.yaml
