## Auto-Todo Builder

Auto-Todo Builder is an intelligent task extraction tool that automatically scans your screen for potential tasks and todos from various sources like emails, chat messages, browser content, and more. It compiles these tasks into a dynamic dashboard and can send you reminders to help you stay organized.

Auto-Todo Builder Dashboard
Features

Automatic Task Detection: Scans your screen content to identify potential tasks and todos
Multi-source Support: Extracts tasks from emails, chat applications, browsers, and documents
Priority Detection: Automatically assigns priority levels based on context and keywords
Deduplication: Intelligently prevents duplicate tasks using advanced similarity detection
Customizable Settings: Configure scan intervals, notification preferences, and more
Task Management: Mark tasks as completed, pending, or cancelled
Filtering: Filter tasks by source, priority, and status
Statistics Dashboard: View completion rates and task distribution

## Installation
Prerequisites

    Node.js 16.x or higher
    Next.js 13.x or higher
    Screenpipe desktop application installed and running

## Setup

Clone the repository:

    git clone https://github.com/yourusername/auto-todo-builder.git
    cd auto-todo-builder
2. Install dependencies:

```shellscript
npm install
```


3. Create a `.env.local` file in the root directory with the following variables:

```plaintext
# Optional: For enhanced AI-powered task extraction
GROQ_API_KEY=your_groq_api_key
```


4. Start the development server:

```shellscript
npm run dev
```


5. Open [http://localhost:3000](http://localhost:3000) in your browser

Video Link
https://www.loom.com/share/b0df1b81703f487bbe896e1ec345f221?sid=87476f04-ca88-4934-8433-43dec49ac938


![Screenshot 2025-03-03 200142](https://github.com/user-attachments/assets/4d0e3f1f-487d-41fe-8fd5-5258e83ca57c)

## Usage

### Getting Started

1. Make sure the Screenpipe desktop application is running
2. Open Auto-Todo Builder in your browser
3. The application will automatically start scanning your screen for tasks
4. Tasks will appear in the dashboard as they are detected


### Configuration

Click the "Settings" button in the top right corner to configure:

- **Scan Interval**: How frequently the application scans for new tasks
- **Notifications**: Enable/disable desktop notifications for new tasks
- **Auto-detection**: Enable/disable automatic task detection
- **Sources**: Select which applications to scan for tasks
- **Priority Keywords**: Customize keywords that determine task priority


### Task Management

- **Complete a Task**: Click the checkbox next to a task or use the dropdown menu
- **Cancel a Task**: Use the dropdown menu to mark a task as cancelled
- **Filter Tasks**: Use the filters at the top of the dashboard to filter by source, priority, or status
- **View Task Sources**: Switch to the "Data Sources" tab to see where tasks are coming from


## Troubleshooting

### Common Issues

- **Application shows "Disconnected"**: Make sure the Screenpipe desktop application is running
- **No tasks are being detected**: Check the Settings to ensure auto-detection is enabled
- **Application is stuck loading**: Try refreshing the page or restarting the Screenpipe application


### Screenpipe Connection

Auto-Todo Builder requires the Screenpipe desktop application to be running to scan your screen. If you're having connection issues:

1. Make sure Screenpipe is installed and running
2. Check that port 7777 is available and not blocked by a firewall
3. Verify that screen capture permissions are enabled for Screenpipe
4. Try restarting the Screenpipe application


## Advanced Configuration

### Task Detection Customization

You can customize how tasks are detected by modifying the priority keywords in the Settings. For example:

- **High Priority**: urgent, asap, immediately, critical
- **Medium Priority**: soon, important, needed
- **Low Priority**: whenever, low priority, eventually


### API Integration

Auto-Todo Builder can use the Groq API for enhanced task extraction. To enable this:

1. Obtain a Groq API key from [groq.com](https://groq.com)
2. Add the API key to your `.env.local` file as `GROQ_API_KEY`
3. Restart the application



## Acknowledgements

- [Screenpipe](https://github.com/mediar-ai/screenpipe) for screen content extraction
- [Next.js](https://nextjs.org/) for the application framework
- [shadcn/ui](https://ui.shadcn.com/) for UI components

