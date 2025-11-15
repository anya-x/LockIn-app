#!/bin/bash

API_KEY="sk-ant-api03-YOUR_KEY_HERE"

curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Hello! Can you help me break down tasks?"
      }
    ]
  }'
