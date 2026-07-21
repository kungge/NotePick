import type { ReadabilityResult } from './index';

// ===== Message Direction: Content Script → Service Worker =====

export interface CaptureSelectionRequest {
  type: 'CAPTURE_SELECTION';
  payload: {
    text: string;
    html: string;
    /** Auto-generated: first 30 chars of selection */
    title: string;
    source: {
      url: string;
      title: string;
      domain: string;
      favicon?: string;
      selectionContext: { before: string; after: string };
    };
  };
}

export interface CapturePageRequest {
  type: 'CAPTURE_PAGE';
  payload: {
    rawHtml: string;
    readability: ReadabilityResult | null;
    extractionFailed: boolean;
    source: {
      url: string;
      title: string;
      domain: string;
      favicon?: string;
    };
  };
}

// ===== Message Direction: Service Worker → Content Script =====

export interface GetSelectionCommand {
  type: 'GET_SELECTION';
}

export interface GetPageContentCommand {
  type: 'GET_PAGE_CONTENT';
}

export interface ShowToastCommand {
  type: 'SHOW_TOAST';
  payload: {
    message: string;
    type: 'success' | 'error' | 'warning';
    /** Pass noteId for potential click-to-edit (P1) */
    noteId?: string;
  };
}

// ===== Message Direction: Popup → Service Worker =====

export interface TriggerSelectionCaptureMsg {
  type: 'TRIGGER_SELECTION_CAPTURE';
  tabId: number;
}

export interface TriggerPageCaptureMsg {
  type: 'TRIGGER_PAGE_CAPTURE';
  tabId: number;
}

export interface OpenManagerMsg {
  type: 'OPEN_MANAGER';
}

// ===== Unified Message Type (Discriminated Union) =====
export type ExtMessage =
  | CaptureSelectionRequest
  | CapturePageRequest
  | GetSelectionCommand
  | GetPageContentCommand
  | ShowToastCommand
  | TriggerSelectionCaptureMsg
  | TriggerPageCaptureMsg
  | OpenManagerMsg;

// ===== Message Response =====
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
