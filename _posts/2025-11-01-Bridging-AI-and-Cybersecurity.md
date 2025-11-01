---
title: Bridging AI and Cybersecurity - A Kali Linux MCP Server
date: 2025-11-01T12:00:00-00:00
categories:
  - AI
excerpt: "Using MCP to connect AI to kali linux"
tags:
  - AI
  - Tools
toc: true
toc_label: ""
toc_sticky: true
---

# Bridging AI and Cybersecurity: A Kali Linux MCP Server

## What is MCP?

The Model Context Protocol (MCP) is an open standard developed by Anthropic that enables AI assistants like Claude to securely interact with external tools and data sources. Think of it as a universal adapter that allows large language models to extend their capabilities beyond text generation into real-world actions.

At its core, MCP defines a standardized JSON-RPC protocol for communication between AI models and "servers" - specialized programs that expose specific tools and capabilities. When you connect an MCP server to Claude Desktop or other MCP-compatible clients, the AI can discover available tools, understand their schemas, and invoke them with appropriate parameters.

The beauty of MCP lies in its simplicity and security model. Servers expose tools via a well-defined protocol, and clients (like Claude Desktop) handle the user interaction and permission management. This creates a clean separation of concerns: the server focuses on tool execution, while the client manages authorization and user experience.

## MCP for Pentesting and Cybersecurity

The intersection of AI and cybersecurity represents a fascinating frontier. Penetration testing and security analysis involve complex workflows that combine reconnaissance, enumeration, exploitation, and reporting. These workflows typically require:

- Running specialized security tools with precise command-line parameters
- Chaining multiple tools together based on previous results
- Interpreting technical output and making strategic decisions
- Documenting findings in a structured format

This is where AI-assisted security testing becomes compelling. By exposing security tools through MCP, we can leverage Claude's natural language understanding and reasoning capabilities to:

**1. Lower the learning curve**: Instead of memorizing complex command-line syntax for 50+ tools, security professionals can describe their intent in plain English. "Scan this network for web servers" becomes a conversation, not a man page lookup.

**2. Intelligent tool chaining**: Claude can analyze reconnaissance results and automatically suggest appropriate follow-up actions. Find an open port? Claude can recommend and execute the right enumeration tools.

**3. Context-aware analysis**: Rather than dumping raw nmap XML output, Claude can parse results, highlight interesting findings, and explain their security implications in context.

**4. Documentation automation**: Security assessments require extensive documentation. Claude can automatically generate professional reports from tool outputs, saving hours of manual work.

**5. Education and training**: Junior security researchers can learn by observing how Claude approaches problems, seeing which tools are appropriate for different scenarios.

Of course, this raises important ethical considerations. Security tools are dual-use by nature - the same nmap scan can be used for legitimate network auditing or reconnaissance for an attack. This is why MCP servers for security tools should:

- Only be used in authorized testing environments
- Include appropriate access controls and logging
- Be clearly documented for their intended legitimate use cases
- Follow responsible disclosure practices

## Introducing the Kali Linux MCP Server

With that context, let me introduce this project: a Docker-based MCP server that exposes 50+ Kali Linux security tools through the Model Context Protocol.

### Architecture Overview

The system consists of three main components:

**1. MCP Server (`mcp_server.py`)**

The core server implements the MCP protocol specification (2025-06-18 version) and handles:

- **Automatic Tool Discovery**: At startup, the server probes the system for available security tools using `which` commands. This means you don't need to manually register tools - if it's installed and in PATH, it's exposed.

- **Dynamic Schema Generation**: Each tool is automatically wrapped with an appropriate JSON schema describing its parameters. The server intelligently marks parameters like 'target', 'url', or 'domain' as required fields.

- **Async Command Execution**: Tool invocations are handled via Python's asyncio subprocess execution, with sensible defaults like 300-second timeouts and output truncation (10KB stdout, 5KB stderr) to prevent overwhelming responses.

- **JSON-RPC over stdio**: The server communicates via standard input/output, making it compatible with Claude Desktop's process-based server model.

**2. Docker Container**

The Dockerfile is optimized for size and performance:

- Based on `kalilinux/kali-rolling` for the latest security tools
- Single large RUN command to minimize image layers
- Cleanup in the same layer to avoid bloating the image
- Headless tools only (no GUI dependencies)
- PostgreSQL included for Metasploit database support

**3. Startup Script (`start_services.sh`)**

Handles service initialization:

- Starts PostgreSQL for Metasploit's database backend
- Initializes Metasploit database with `msfdb init`
- Detects whether running interactively or as daemon
- In interactive mode, launches the MCP server with `--stdio`

### Available Tools

The server exposes a comprehensive suite of security tools across multiple categories:

- **Network Scanning**: nmap, masscan, hping3, netdiscover
- **Web Application Testing**: nikto, sqlmap, gobuster, wfuzz, ffuf, wpscan, dirb
- **Password Cracking**: john, hashcat, hydra, medusa
- **Information Gathering**: theharvester, sublist3r, dnsenum, dnsrecon, fierce, wafw00f
- **Forensics**: binwalk, foremost, volatility, strings, exiftool
- **Reverse Engineering**: radare2, gdb, objdump, strace
- **Exploitation**: metasploit-framework, msfvenom, searchsploit
- **SSL/TLS Analysis**: sslscan, sslyze
- **And many more...**

The full list is discovered dynamically based on what's available in the container.

### Getting Started

#### 1. Build the Docker Image

```bash
docker build -f dockerfile -t kali-mcp .
```

The build process installs all security tools and sets up the environment. This may take several minutes on first build.

#### 2. Run the Container

**Important**: Many security tools (nmap, masscan, hping3) require elevated network privileges. You have two options:

```bash
# Recommended: Add specific capabilities
docker run -d --name kali-mcp \
  --cap-add=NET_ADMIN \
  --cap-add=NET_RAW \
  -p 4444:4444 \
  kali-mcp

# Alternative: Privileged mode (less secure but ensures everything works)
docker run -d --name kali-mcp --privileged -p 4444:4444 kali-mcp
```

The `--cap-add` flags grant:
- `NET_ADMIN`: Network configuration capabilities
- `NET_RAW`: Raw socket access for tools like nmap

#### 3. Configure Claude Desktop

To connect this MCP server to Claude Desktop, edit your configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

**For macOS/Linux:**
```json
{
  "mcpServers": {
    "kali-mcp": {
      "command": "docker",
      "args": ["exec", "-i", "kali-mcp", "python3", "/app/mcp_server.py", "--stdio"]
    }
  }
}
```

**For Windows:**
```json
{
  "mcpServers": {
    "kali-mcp": {
      "command": "docker",
      "args": ["exec", "-i", "kali-mcp", "sh", "-c", "python3 /app/mcp_server.py --stdio"]
    }
  }
}
```

Note: Windows requires the `sh -c` wrapper to prevent path conversion issues.

#### 4. Restart Claude Desktop

Completely quit and restart Claude Desktop. The Kali MCP server should automatically connect and you'll see all available tools.

#### 5. Test It Out

Try asking Claude:

- "Can you scan localhost with nmap to see what ports are open?"
- "Use nikto to scan example.com for web vulnerabilities"
- "What information can theharvester find about google.com?"

### Technical Deep Dive

#### MCP Protocol Implementation

The server implements four core MCP methods:

**`initialize`**: Returns server capabilities and protocol version
```json
{
  "protocolVersion": "2024-11-05",
  "capabilities": {
    "tools": {}
  },
  "serverInfo": {
    "name": "kali-tools",
    "version": "1.0.0"
  }
}
```

**`notifications/initialized`**: Acknowledgment from client (no response needed)

**`tools/list`**: Returns all discovered tools with JSON schemas
```json
{
  "tools": [
    {
      "name": "nmap_scan",
      "description": "Network scanning with nmap",
      "inputSchema": {
        "type": "object",
        "properties": {
          "target": {"type": "string", "description": "Target IP or hostname"},
          "options": {"type": "string", "description": "Additional nmap options"}
        },
        "required": ["target"]
      }
    },
    // ... 50+ more tools
  ]
}
```

**`tools/call`**: Executes a tool with provided arguments

The request/response flow works like this:

1. Claude Desktop sends a JSON-RPC request via stdin
2. The server parses the method and routes to the appropriate handler
3. For `tools/call`, it constructs the command and executes via subprocess
4. Output is captured and returned in a JSON-RPC response via stdout
5. Claude receives the output and can reason about next steps

#### Adding Custom Tools

The tool registry is defined in `tool_categories` dictionary:

```python
tool_categories = {
    'Network': {
        'nmap_scan': {'cmd': 'nmap', 'params': ['target', 'options']},
        'masscan_scan': {'cmd': 'masscan', 'params': ['target', 'port', 'rate']},
        # ...
    },
    'Web': {
        'nikto_scan': {'cmd': 'nikto', 'params': ['target', 'options']},
        # ...
    }
}
```

To add a new tool:

1. Install it in the Dockerfile: Add to the `apt-get install` list
2. Register it in `tool_categories`: Define command and parameters
3. Rebuild the image: `docker build -f dockerfile -t kali-mcp .`

Parameters named 'target', 'url', 'domain', 'file', or 'command' are automatically marked as required in the schema.

#### Security Considerations

**Output Truncation**: Tool output is limited to 10KB (stdout) and 5KB (stderr) to prevent massive responses from overwhelming Claude's context window.

**Timeouts**: Commands have a 300-second (5-minute) default timeout to prevent hung processes.

**Container Isolation**: Running in Docker provides process isolation from the host system. However, tools with `NET_RAW` capabilities can still perform network operations.

**No Persistent Storage**: By default, the container filesystem is ephemeral. Add volume mounts if you need to persist scan results.

## Ethical Use and Legal Considerations

This tool is designed for **authorized security testing only**. Before using any security scanning tool:

- Obtain written permission from network/system owners
- Only test systems you own or have explicit authorization to test
- Follow responsible disclosure practices for any vulnerabilities found
- Comply with local laws and regulations (e.g., CFAA in the US)
- Use in educational environments, CTF competitions, or authorized penetration tests

Unauthorized scanning is illegal and unethical. This project is intended to support legitimate security professionals, researchers, and students learning cybersecurity in controlled environments.

## Future Enhancements

Some ideas for extending this project:

**Output Parsing**: Add structured parsers for common tool outputs (nmap XML, JSON formats) to provide more intelligent summaries to Claude.

**Tool Chaining**: Create higher-level "workflow" tools that automatically chain multiple tools together (e.g., "full_web_scan" that runs nmap → nikto → gobuster in sequence).

**Result Persistence**: Mount a volume to persist scan results and allow Claude to reference previous findings.

**Custom Tool Wrappers**: Write Python wrappers around tools to provide better error handling and output formatting.

**Integration with Reporting**: Connect to platforms like Faraday or DefectDojo to automatically import findings into vulnerability management systems.

**Rate Limiting**: Add configurable rate limits for scanning tools to prevent accidental DoS scenarios.

## Conclusion

The Kali Linux MCP Server demonstrates how the Model Context Protocol can bridge the gap between AI reasoning capabilities and specialized security tools. By exposing 50+ penetration testing tools through a standardized interface, we enable security professionals to work more efficiently, lower the barrier to entry for new practitioners, and automate tedious aspects of security assessments.

The combination of Claude's natural language understanding with the power of Kali's tool suite creates a force multiplier for security work. Instead of context-switching between terminal windows, documentation, and manual note-taking, analysts can have a conversation with Claude about their assessment goals and let the AI handle tool selection, execution, and preliminary analysis.

As MCP adoption grows, we'll see more creative integrations between AI and specialized domains. Security is just one example - the same pattern applies to data science, system administration, content creation, and countless other fields that rely on powerful command-line tools.

The code is open source and available for you to explore, modify, and extend for your own authorized security testing needs. Happy (ethical) hacking!

---

**Repository**: [https://github.com/JDMcE/kali-mcp-server](https://github.com/JDMcE/kali-mcp-server)
