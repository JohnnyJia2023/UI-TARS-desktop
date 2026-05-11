/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { OpenAI } from 'openai';
import { initIpc } from '@ui-tars/electron-ipc/main';
import { logger } from '../logger';

const t = initIpc.create();

const COPILOT_BASE_URL = 'https://api.githubcopilot.com';

const getOpenAIClientConfig = (input: {
  baseUrl: string;
  apiKey: string; // secretlint-disable-line @secretlint/secretlint-rule-pattern
  modelName: string;
}) => {
  const isCopilot =
    input.baseUrl.replace(/\/+$/, '') === COPILOT_BASE_URL.replace(/\/+$/, '');

  return {
    apiKey: input.apiKey, // secretlint-disable-line @secretlint/secretlint-rule-pattern
    baseURL: input.baseUrl,
    ...(isCopilot
      ? {
          defaultHeaders: {
            'Editor-Version': 'vscode/1.104.1',
            'Copilot-Integration-Id': 'vscode-chat',
            'Openai-Intent': 'conversation-edits',
            'x-initiator': 'agent',
            'Copilot-Vision-Request': 'true',
          },
        }
      : {}),
  };
};

export const settingRoute = t.router({
  checkVLMResponseApiSupport: t.procedure
    .input<{
      baseUrl: string;
      apiKey: string; // secretlint-disable-line @secretlint/secretlint-rule-pattern
      modelName: string;
    }>()
    .handle(async ({ input }) => {
      try {
        const openai = new OpenAI(getOpenAIClientConfig(input));
        const result = await openai.responses.create({
          model: input.modelName,
          input: 'return 1+1=?',
          stream: false,
        });
        console.log('result', result);
        return Boolean(result?.id || result?.previous_response_id);
      } catch (e) {
        logger.warn('[checkVLMResponseApiSupport] failed:', e);
        return false;
      }
    }),
  checkModelAvailability: t.procedure
    .input<{
      baseUrl: string;
      apiKey: string; // secretlint-disable-line @secretlint/secretlint-rule-pattern
      modelName: string;
    }>()
    .handle(async ({ input }) => {
      try {
        const openai = new OpenAI(getOpenAIClientConfig(input));
        const completion = await openai.chat.completions.create({
          model: input.modelName,
          messages: [{ role: 'user', content: 'return 1+1=?' }],
          stream: false,
        });
        console.log('result', completion);

        return Boolean(completion?.id || completion.choices[0].message.content);
      } catch (e) {
        throw e;
      }
    }),
});
