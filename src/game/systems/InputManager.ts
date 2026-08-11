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
  };
  isConnected: boolean;
}

export class InputManager {
  private static gamepadState: GamepadState = {
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
    buttons: {
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
    },
    isConnected: false,
  };

  private static keyboardState: Record<string, boolean> = {};

  /**
   * Inicializa listeners de entrada
   */
  public static init(): void {
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
   * Poll gamepad state a cada frame (necessário pois Gamepad API não dispara eventos em mudanças)
   */
  private static pollGamepads(): void {
    const gamepads = navigator.getGamepads?.() || [];
    const gamepad = gamepads[0]; // Pega primeiro gamepad conectado

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
    } else {
      this.gamepadState.isConnected = false;
    }

    requestAnimationFrame(() => this.pollGamepads());
  }

  private static onGamepadConnected(e: GamepadEvent): void {
    console.log(`Gamepad conectado: ${e.gamepad.id}`);
    this.gamepadState.isConnected = true;
  }

  private static onGamepadDisconnected(e: GamepadEvent): void {
    console.log(`Gamepad desconectado: ${e.gamepad.id}`);
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
