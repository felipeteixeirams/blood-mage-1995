import { logger } from '../../utils/logger';

/**
 * InputManager (Fase 5)
 * Abstração unificada para entrada do jogador
 * Suporta: Gamepad API (Xbox/PlayStation/Genérico), Touch (Virtual Joystick), Keyboard
 */

export interface GamepadState {
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  buttons: {
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    lb: boolean;
    rb: boolean;
    lt: boolean;
    rt: boolean;
    start: boolean;
    select: boolean;
    leftStickClick: boolean;
    rightStickClick: boolean;
    dpadUp: boolean;
    dpadDown: boolean;
    dpadLeft: boolean;
    dpadRight: boolean;
  };
  isConnected: boolean;
}

export class InputManager {
  private static createDefaultButtons(): GamepadState['buttons'] {
    return {
      a: false,
      b: false,
      x: false,
      y: false,
      lb: false,
      rb: false,
      lt: false,
      rt: false,
      start: false,
      select: false,
      leftStickClick: false,
      rightStickClick: false,
      dpadUp: false,
      dpadDown: false,
      dpadLeft: false,
      dpadRight: false,
    };
  }

  private static createDefaultGamepadState(): GamepadState {
    return {
      leftStick: { x: 0, y: 0 },
      rightStick: { x: 0, y: 0 },
      buttons: this.createDefaultButtons(),
      isConnected: false,
    };
  }

  private static gamepadState: GamepadState = InputManager.createDefaultGamepadState();

  private static keyboardState: Record<string, boolean> = {};
  private static initialized: boolean = false;
  private static prevButtons: GamepadState['buttons'] = InputManager.createDefaultButtons();

  /**
   * Inicializa listeners de entrada (idempotente — evita listeners duplicados
   * quando a GameScene é recriada em restart).
   */
  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Gamepad events
    window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e));
    window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));

    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keyboardState[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keyboardState[e.key.toLowerCase()] = false;
    });

    // Start polling gamepads
    this.pollGamepads();
  }

  /**
   * Reseta o estado de inputs (usado principalmente em testes para evitar
   * vazamento de estado estático entre execuções).
   */
  public static resetForTests(): void {
    this.initialized = false;
    this.keyboardState = {};
    this.gamepadState = this.createDefaultGamepadState();
    this.prevButtons = this.createDefaultButtons();
  }

  /**
   * Poll gamepad state a cada frame (necessário pois Gamepad API não dispara eventos em mudanças)
   */
  private static pollGamepads(): void {
    this.readGamepadState();
    requestAnimationFrame(() => this.pollGamepads());
  }

  /**
   * Lê o estado atual do gamepad uma única vez (sincronamente).
   * Público para testes; o loop de polling privado a chama a cada frame.
   */
  public static readGamepadState(): void {
    const gamepads = navigator.getGamepads?.() || [];
    const gamepad = gamepads[0]; // Pega primeiro gamepad conectado

    // Preserva estado anterior dos botões para edge-detection
    const prev = this.gamepadState.buttons;
    this.prevButtons = {
      a: prev.a, b: prev.b, x: prev.x, y: prev.y,
      lb: prev.lb, rb: prev.rb, lt: prev.lt, rt: prev.rt,
      select: prev.select, start: prev.start,
      leftStickClick: prev.leftStickClick, rightStickClick: prev.rightStickClick,
      dpadUp: prev.dpadUp, dpadDown: prev.dpadDown, dpadLeft: prev.dpadLeft, dpadRight: prev.dpadRight,
    };

    if (gamepad && gamepad.connected) {
      this.gamepadState.isConnected = true;

      // Left stick (axes 0, 1)
      this.gamepadState.leftStick.x = gamepad.axes[0] || 0;
      this.gamepadState.leftStick.y = gamepad.axes[1] || 0;

      // Right stick (axes 2, 3)
      this.gamepadState.rightStick.x = gamepad.axes[2] || 0;
      this.gamepadState.rightStick.y = gamepad.axes[3] || 0;

      // Botões (padrão: Standard Gamepad Layout)
      // 0: A (bottom), 1: B (right), 2: X (left), 3: Y (top)
      // 4: LB, 5: RB, 6: LT, 7: RT, 8: Select, 9: Start, 10: L Stick click, 11: R Stick click
      this.gamepadState.buttons.a = gamepad.buttons[0]?.pressed || false;
      this.gamepadState.buttons.b = gamepad.buttons[1]?.pressed || false;
      this.gamepadState.buttons.x = gamepad.buttons[2]?.pressed || false;
      this.gamepadState.buttons.y = gamepad.buttons[3]?.pressed || false;
      this.gamepadState.buttons.lb = gamepad.buttons[4]?.pressed || false;
      this.gamepadState.buttons.rb = gamepad.buttons[5]?.pressed || false;
      this.gamepadState.buttons.lt = gamepad.buttons[6]?.pressed || false;
      this.gamepadState.buttons.rt = gamepad.buttons[7]?.pressed || false;
      this.gamepadState.buttons.select = gamepad.buttons[8]?.pressed || false;
      this.gamepadState.buttons.start = gamepad.buttons[9]?.pressed || false;
      this.gamepadState.buttons.leftStickClick = gamepad.buttons[10]?.pressed || false;
      this.gamepadState.buttons.rightStickClick = gamepad.buttons[11]?.pressed || false;
      // 12: D-pad Up, 13: D-pad Down, 14: D-pad Left, 15: D-pad Right
      this.gamepadState.buttons.dpadUp = gamepad.buttons[12]?.pressed || false;
      this.gamepadState.buttons.dpadDown = gamepad.buttons[13]?.pressed || false;
      this.gamepadState.buttons.dpadLeft = gamepad.buttons[14]?.pressed || false;
      this.gamepadState.buttons.dpadRight = gamepad.buttons[15]?.pressed || false;
    } else {
      this.gamepadState.isConnected = false;
    }
  }

  private static onGamepadConnected(e: GamepadEvent): void {
    logger.info('INPUT', `Gamepad conectado: ${e.gamepad.id}`, { gamepadId: e.gamepad.id });
    this.gamepadState.isConnected = true;
  }

  private static onGamepadDisconnected(e: GamepadEvent): void {
    logger.info('INPUT', `Gamepad desconectado: ${e.gamepad.id}`, { gamepadId: e.gamepad.id });
    this.gamepadState.isConnected = false;
  }

  /**
   * Obter movimento unificado (prioridade: Gamepad > Keyboard)
   * Retorna { x, y } normalizado (-1 a 1)
   */
  public static getMovementInput(): { x: number; y: number } {
    // Preferir gamepad
    if (this.gamepadState.isConnected) {
      const x = this.gamepadState.leftStick.x;
      const y = this.gamepadState.leftStick.y;
      // Deadzone (ignorar movimentos muito pequenos)
      const magnitude = Math.sqrt(x * x + y * y);
      if (magnitude > 0.1) {
        return { x, y };
      }
    }

    // Fallback: Keyboard (WASD ou Arrow Keys)
    let x = 0;
    let y = 0;
    if (this.keyboardState['w'] || this.keyboardState['arrowup']) y -= 1;
    if (this.keyboardState['s'] || this.keyboardState['arrowdown']) y += 1;
    if (this.keyboardState['a'] || this.keyboardState['arrowleft']) x -= 1;
    if (this.keyboardState['d'] || this.keyboardState['arrowright']) x += 1;

    // Normalizar diagonal
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude > 0) {
      return { x: x / magnitude, y: y / magnitude };
    }

    return { x: 0, y: 0 };
  }

  /**
   * Obter aim input (right stick do gamepad ou Mouse)
   */
  public static getAimInput(): { x: number; y: number } {
    if (this.gamepadState.isConnected) {
      const x = this.gamepadState.rightStick.x;
      const y = this.gamepadState.rightStick.y;
      // Deadzone
      const magnitude = Math.sqrt(x * x + y * y);
      if (magnitude > 0.1) {
        return { x, y };
      }
    }

    // Sem input de aim via teclado (será feito via mouse/touch em outro lugar)
    return { x: 0, y: 0 };
  }

  /**
   * Obter estado do gamepad completo
   */
  public static getGamepadState(): GamepadState {
    return { ...this.gamepadState };
  }

  /**
   * Verificar se botão específico foi pressionado
   */
  public static isButtonPressed(button: keyof GamepadState['buttons']): boolean {
    return this.gamepadState.buttons[button];
  }

  /**
   * Detecção de borda de subida (just-pressed) para botões do gamepad.
   * Retorna true apenas na primeira chamada enquanto o botão permanece pressionado.
   */
  public static wasButtonPressed(button: keyof GamepadState['buttons']): boolean {
    const pressed = this.gamepadState.buttons[button] && !this.prevButtons[button];
    this.prevButtons[button] = this.gamepadState.buttons[button];
    return pressed;
  }

  /**
   * Verificar se tecla foi pressionada (keycode em lowercase)
   */
  public static isKeyPressed(key: string): boolean {
    return this.keyboardState[key.toLowerCase()] || false;
  }

  /**
   * Verificar se gamepad está conectado
   */
  public static isGamepadConnected(): boolean {
    return this.gamepadState.isConnected;
  }
}

export default InputManager;
