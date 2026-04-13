export function getStyles(primaryColor: string): string {
  return `
    *,
    *::before,
    *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :host {
      --ho-primary: ${primaryColor};
      --ho-primary-hover: color-mix(in srgb, ${primaryColor} 85%, #000);
      --ho-primary-active: color-mix(in srgb, ${primaryColor} 70%, #000);
      --ho-bg: #ffffff;
      --ho-border: #d1d5db;
      --ho-text: #111827;
      --ho-text-muted: #6b7280;
      --ho-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
      --ho-radius: 8px;
      --ho-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-family: var(--ho-font);
      font-size: 14px;
      line-height: 1.5;
      color: var(--ho-text);
    }

    /* Slide-up animation */
    @keyframes ho-slide-up {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes ho-fade-in {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Bottom bar */
    .ho-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--ho-bg);
      box-shadow: var(--ho-shadow);
      z-index: 999999;
      animation: ho-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      border-top: 1px solid var(--ho-border);
    }

    .ho-bar.ho-hidden {
      display: none;
    }

    .ho-bar-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 14px 20px;
      display: flex;
      align-items: flex-end;
      gap: 12px;
    }

    /* Close button */
    .ho-close {
      position: absolute;
      top: 8px;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ho-text-muted);
      font-size: 18px;
      line-height: 1;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.15s, color 0.15s;
    }

    .ho-close:hover {
      background: #f3f4f6;
      color: var(--ho-text);
    }

    /* Field groups */
    .ho-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    .ho-field-narrow {
      flex: 0 0 auto;
      width: 100px;
    }

    .ho-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--ho-text-muted);
    }

    /* Inputs */
    .ho-input {
      height: 42px;
      padding: 0 12px;
      border: 1.5px solid var(--ho-border);
      border-radius: var(--ho-radius);
      font-size: 14px;
      font-family: var(--ho-font);
      color: var(--ho-text);
      background: #fff;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      width: 100%;
    }

    .ho-input:focus {
      border-color: var(--ho-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, ${primaryColor} 20%, transparent);
    }

    input[type="date"].ho-input {
      cursor: pointer;
    }

    /* Number selector */
    .ho-number-wrap {
      display: flex;
      align-items: center;
      height: 42px;
      border: 1.5px solid var(--ho-border);
      border-radius: var(--ho-radius);
      overflow: hidden;
      background: #fff;
    }

    .ho-number-btn {
      width: 34px;
      height: 100%;
      border: none;
      background: #f9fafb;
      cursor: pointer;
      font-size: 18px;
      font-weight: 500;
      color: var(--ho-text);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
      user-select: none;
      font-family: var(--ho-font);
    }

    .ho-number-btn:hover {
      background: #f3f4f6;
    }

    .ho-number-btn:active {
      background: #e5e7eb;
    }

    .ho-number-btn:disabled {
      color: #d1d5db;
      cursor: not-allowed;
      background: #f9fafb;
    }

    .ho-number-val {
      flex: 1;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: var(--ho-text);
      min-width: 28px;
    }

    /* CTA button */
    .ho-btn {
      height: 42px;
      padding: 0 24px;
      background: var(--ho-primary);
      color: #fff;
      border: none;
      border-radius: var(--ho-radius);
      font-size: 14px;
      font-weight: 600;
      font-family: var(--ho-font);
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, transform 0.1s;
      flex-shrink: 0;
    }

    .ho-btn:hover {
      background: var(--ho-primary-hover);
    }

    .ho-btn:active {
      background: var(--ho-primary-active);
      transform: scale(0.98);
    }

    /* Minimized floating button */
    .ho-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      height: 48px;
      padding: 0 24px;
      background: var(--ho-primary);
      color: #fff;
      border: none;
      border-radius: 24px;
      font-size: 15px;
      font-weight: 600;
      font-family: var(--ho-font);
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      z-index: 999999;
      animation: ho-fade-in 0.25s ease forwards;
      transition: background 0.15s, transform 0.15s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ho-fab.ho-hidden {
      display: none;
    }

    .ho-fab:hover {
      background: var(--ho-primary-hover);
      transform: scale(1.05);
    }

    .ho-fab:active {
      background: var(--ho-primary-active);
      transform: scale(0.97);
    }

    .ho-fab-icon {
      font-size: 18px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .ho-bar-inner {
        flex-wrap: wrap;
        padding: 12px 16px 16px;
        gap: 8px;
      }

      .ho-field {
        flex: 1 1 calc(50% - 4px);
        min-width: calc(50% - 4px);
      }

      .ho-field-narrow {
        width: auto;
        flex: 1 1 calc(50% - 4px);
        min-width: calc(50% - 4px);
      }

      .ho-btn {
        width: 100%;
        height: 46px;
        font-size: 15px;
      }

      .ho-close {
        top: 4px;
        right: 8px;
      }
    }

    @media (max-width: 420px) {
      .ho-field,
      .ho-field-narrow {
        flex: 1 1 100%;
        min-width: 100%;
      }
    }
  `;
}
