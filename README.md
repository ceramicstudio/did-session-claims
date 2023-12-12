## Sign Credentials on ComposeDB with Authenticated DIDSession

This application shows how developers can use a simple ComposeDB schema definition and existing native Ceramic utilities to allow their users to sign tamper-evident JWT credentials.

1. Install your dependencies:

Install your dependencies:

```bash
npm install
```

2. Generate your admin seed, admin did, and ComposeDB configuration file:

Next, we will need to generate an admin seed and ComposeDB configuration our application will use. This example repository contains a script found at /client/scripts/commands/mjs that generates one for you (preset to run "inmemory" which is ideal for testing).

To generate your necessary credentials, run the following in your terminal:

```bash
npm run generate
```

3. Start your IPFS Daemon: 

```bash
ipfs daemon --enable-pubsub-experiment && ipfs config --json 
'{
  "API": {
    "HTTPHeaders": {
      "Access-Control-Allow-Origin": [
        "",
        "http://127.0.0.1:8080",
        "http://localhost:3000"
      ]
    }
  }
}'
```

4. Finally, run your application in a new terminal (first ensure you are running node v16 in your terminal):

```bash
nvm use 16
npm run dev
```

If you explore your composedb.config.json and admin_seed.txt files, you will now see a defined JSON ComposeDB server configuration and Ceramic admin seed, respectively.

5. Visit port 3000 in your browser to begin creating credentials

## Learn More

To learn more about Ceramic please visit the following links

- [Ceramic Documentation](https://developers.ceramic.network/learn/welcome/) - Learn more about the Ceramic Ecosystem.
- [ComposeDB](https://composedb.js.org/) - Details on how to use and develop with ComposeDB!
- [AI Chatbot on ComposeDB](https://learnweb3.io/lessons/build-an-ai-chatbot-on-compose-db-and-the-ceramic-network) - Build an AI-powered Chatbot and save message history to ComposeDB
- [ComposeDB API Sandbox](https://developers.ceramic.network/sandbox) - Test GraphQL queries against a live dataset directly from your browser
- [Ceramic Blog](https://blog.ceramic.network/) - Browse technical tutorials and more on our blog
- [Ceramic Discord](https://discord.com/invite/ceramic) - Join the Ceramic Discord
- [Follow Ceramic on Twitter](https://twitter.com/ceramicnetwork) - Follow us on Twitter for latest announcements!