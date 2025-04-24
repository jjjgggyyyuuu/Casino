# Crypto Casino Slot Game

A modern, provably fair slot machine game with cryptocurrency themes and a freemium credit system.

For detailed UI mockups and screenshots, see [UI-MOCKUPS.md](UI-MOCKUPS.md)

## Features

### 💰 Freemium Credit System
- Start with 100 free credits to try the game
- Purchase additional credits when free credits are depleted
- Various credit packages available at different price points

### 🎰 Modern Slot Machine Experience
- Classic 3-reel, 3-row slot machine design
- Multiple winning symbols with different payout values
- Visually appealing animations and effects

### 🔒 Provably Fair Gaming
- Cryptographically secure random number generation
- SHA-256 hash verification for each spin
- Daily seeds for enhanced randomness
- Transparent Return-to-Player (RTP) statistics

### 💯 Fair Play Mechanics
- Target RTP of 96% (industry-leading)
- Weighted symbol distribution for realistic odds
- Dynamic RTP adjustment to maintain fairness

### 📱 Responsive Design
- Works on desktop and mobile devices
- Adjusts layout based on screen size
- Beautiful UI with neon/cyberpunk aesthetic

## Symbols and Payouts

| Symbol | Match 3 | Description |
|--------|---------|-------------|
| 7️⃣      | 10x     | Jackpot Symbol |
| 💎      | 5x      | Premium Symbol |
| 🍒      | 3x      | Medium Symbol |
| 🍋      | 2x      | Basic Symbol |
| 🍊      | 2x      | Basic Symbol |

## Installation and Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crypto-casino-slot.git
cd crypto-casino-slot
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## Development

### Project Structure
- `src/App.svelte` - Main application component
- `src/routes/api/spin/+server.js` - Server endpoint for slot machine logic
- `vite.config.ts` - Vite configuration with RNG implementation

### Technologies Used
- [SvelteKit](https://kit.svelte.dev/) - Full-stack framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Crypto](https://nodejs.org/api/crypto.html) - For secure RNG

## Customization

### Adjusting Game Odds
To modify the game odds, edit the following in `src/routes/api/spin/+server.js`:
- `targetRtp` - Target Return to Player percentage (default: 0.96 or 96%)
- `weights` array - Controls symbol frequency
- Win probability calculations

### Styling
The game uses custom CSS for styling. Modify the `<style>` section in `App.svelte` to change the appearance.

## Production Deployment

For production deployment:

```bash
npm run build
```

This will create optimized files in the `build` directory that can be deployed to any static hosting service.

## License

MIT License

## Credits

Created by [Your Name]

Enjoy the game and good luck! 🎰✨
