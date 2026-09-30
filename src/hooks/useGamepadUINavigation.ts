import { useEffect, useRef, useState, useCallback } from 'react';
import { soundEngine } from '../utils/soundEngine';

export interface UseGamepadUINavigationOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  isActive?: boolean;
  onClose?: () => void;
  defaultIndex?: number;
  selector?: string;
  horizontalGridColumns?: number;
}

export function useGamepadUINavigation({
  containerRef,
  isActive = true,
  onClose,
  defaultIndex = 0,
  selector = 'button:not([disabled]), [role="button"]:not([aria-disabled="true"]), input:not([disabled]), a[href], [tabindex="0"]',
  horizontalGridColumns,
}: UseGamepadUINavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState<number>(defaultIndex);
  const lastNavTimeRef = useRef<number>(0);
  const prevButtonAPressedRef = useRef<boolean>(false);
  const prevButtonBPressedRef = useRef<boolean>(false);
  const prevButtonStartPressedRef = useRef<boolean>(false);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    const elements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(selector)
    ).filter((el) => {
      const style = window.getComputedStyle(el);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        el.offsetParent !== null
      );
    });
    return elements;
  }, [containerRef, selector]);

  // Aplica o foco visual no elemento selecionado
  const updateVisualFocus = useCallback((index: number) => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const clampedIndex = Math.max(0, Math.min(index, elements.length - 1));

    elements.forEach((el, i) => {
      if (i === clampedIndex) {
        el.setAttribute('data-gamepad-focused', 'true');
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        el.removeAttribute('data-gamepad-focused');
      }
    });

    setFocusedIndex(clampedIndex);
  }, [getFocusableElements]);

  // Inicializa o foco quando o modal/menu abre
  useEffect(() => {
    if (!isActive) {
      const elements = getFocusableElements();
      elements.forEach((el) => el.removeAttribute('data-gamepad-focused'));
      return;
    }

    const timer = setTimeout(() => {
      updateVisualFocus(defaultIndex);
    }, 50);

    return () => {
      clearTimeout(timer);
      const elements = getFocusableElements();
      elements.forEach((el) => el.removeAttribute('data-gamepad-focused'));
    };
  }, [isActive, defaultIndex, getFocusableElements, updateVisualFocus]);

  // Loop de polling do Gamepad para navegação na interface
  useEffect(() => {
    if (!isActive) return;

    let animFrameId: number;

    const poll = (time: number) => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

      if (gp && gp.connected) {
        const elements = getFocusableElements();
        const total = elements.length;

        if (total > 0) {
          const axisX = gp.axes[0] || 0;
          const axisY = gp.axes[1] || 0;

          const dpadUp = gp.buttons[12]?.pressed || false;
          const dpadDown = gp.buttons[13]?.pressed || false;
          const dpadLeft = gp.buttons[14]?.pressed || false;
          const dpadRight = gp.buttons[15]?.pressed || false;

          const btnA = gp.buttons[0]?.pressed || false;
          const btnB = gp.buttons[1]?.pressed || false;
          const btnStart = gp.buttons[9]?.pressed || false;

          const isUp = dpadUp || axisY < -0.5;
          const isDown = dpadDown || axisY > 0.5;
          const isLeft = dpadLeft || axisX < -0.5;
          const isRight = dpadRight || axisX > 0.5;

          const now = time || performance.now();
          const cooldown = 220; // ms entre passos de navegação direcional

          if (now - lastNavTimeRef.current > cooldown) {
            let nextIndex = focusedIndex;

            if (horizontalGridColumns && horizontalGridColumns > 1) {
              // Layout em Grade
              if (isRight) nextIndex = (focusedIndex + 1) % total;
              else if (isLeft) nextIndex = (focusedIndex - 1 + total) % total;
              else if (isDown) nextIndex = Math.min(focusedIndex + horizontalGridColumns, total - 1);
              else if (isUp) nextIndex = Math.max(focusedIndex - horizontalGridColumns, 0);
            } else {
              // Layout em Lista vertical / padrão
              if (isDown || isRight) {
                nextIndex = (focusedIndex + 1) % total;
              } else if (isUp || isLeft) {
                nextIndex = (focusedIndex - 1 + total) % total;
              }
            }

            if (nextIndex !== focusedIndex) {
              lastNavTimeRef.current = now;
              soundEngine.playButtonClick();
              updateVisualFocus(nextIndex);
            }
          }

          // Botão A (Confirmar / Clicar)
          if ((btnA || btnStart) && !prevButtonAPressedRef.current && !prevButtonStartPressedRef.current) {
            const currentEl = elements[focusedIndex];
            if (currentEl) {
              soundEngine.playButtonClick();
              currentEl.click();
            }
          }

          // Botão B (Voltar / Fechar)
          if (btnB && !prevButtonBPressedRef.current) {
            if (onClose) {
              soundEngine.playButtonClick();
              onClose();
            }
          }

          prevButtonAPressedRef.current = btnA;
          prevButtonBPressedRef.current = btnB;
          prevButtonStartPressedRef.current = btnStart;
        }
      }

      animFrameId = requestAnimationFrame(poll);
    };

    animFrameId = requestAnimationFrame(poll);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isActive, focusedIndex, getFocusableElements, updateVisualFocus, onClose, horizontalGridColumns]);

  return {
    focusedIndex,
    setFocusedIndex: updateVisualFocus,
  };
}

export default useGamepadUINavigation;
