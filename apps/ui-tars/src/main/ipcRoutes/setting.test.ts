/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();
const chatCreateMock = vi.fn();
const responsesCreateMock = vi.fn();

vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation((config) => {
    createMock(config);
    return {
      chat: {
        completions: {
          create: chatCreateMock,
        },
      },
      responses: {
        create: responsesCreateMock,
      },
    };
  }),
}));

vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('settingRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds Copilot headers when checking model availability against GitHub Copilot', async () => {
    chatCreateMock.mockResolvedValue({
      id: 'chatcmpl-test',
      choices: [{ message: { content: '2' } }],
    });

    const { settingRoute } = await import('./setting');

    await settingRoute.checkModelAvailability.handle({
      input: {
        baseUrl: 'https://api.githubcopilot.com',
        apiKey: 'test-key', // secretlint-disable-line @secretlint/secretlint-rule-pattern
        modelName: 'gpt-5-mini',
      },
      context: {} as any,
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key', // secretlint-disable-line @secretlint/secretlint-rule-pattern
        baseURL: 'https://api.githubcopilot.com',
        defaultHeaders: expect.objectContaining({
          'Editor-Version': 'vscode/1.104.1',
          'Copilot-Integration-Id': 'vscode-chat',
          'Openai-Intent': 'conversation-edits',
          'x-initiator': 'agent',
          'Copilot-Vision-Request': 'true',
        }),
      }),
    );
  });

  it('adds Copilot headers when checking Responses API support against GitHub Copilot', async () => {
    responsesCreateMock.mockResolvedValue({
      id: 'resp_test',
    });

    const { settingRoute } = await import('./setting');

    await settingRoute.checkVLMResponseApiSupport.handle({
      input: {
        baseUrl: 'https://api.githubcopilot.com',
        apiKey: 'test-key', // secretlint-disable-line @secretlint/secretlint-rule-pattern
        modelName: 'gpt-5-mini',
      },
      context: {} as any,
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key', // secretlint-disable-line @secretlint/secretlint-rule-pattern
        baseURL: 'https://api.githubcopilot.com',
        defaultHeaders: expect.objectContaining({
          'Editor-Version': 'vscode/1.104.1',
          'Copilot-Integration-Id': 'vscode-chat',
          'Openai-Intent': 'conversation-edits',
          'x-initiator': 'agent',
          'Copilot-Vision-Request': 'true',
        }),
      }),
    );
  });
});
