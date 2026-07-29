# worldcup-management
An application to management world cup 2026 statistic and match result to avoid needing to check everything 
Features:
1. Match result for each match
2. Match detail, who score, card, etc
3. Knockout bracket visulization 
4. Odds of winning for each team 
5. Player to watch
6. Schedule for next match 
7. Awards statistic. Example: assist, score board. Golden balls, golden gloves, golden shoe
8. Own tournament, allow user to build their own tournament which randomly generate its own groups, barckets, with odd for each match and allow user to choose the result

The data is accurate according to FIFA information

## Running the project

### Prerequisites

- Node.js 24
- npm

If you use `nvm`, select the project's Node.js version:

```bash
nvm install
nvm use
```

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run project checks

```bash
npm run lint
npm run typecheck
npm test
```

### Create and run a production build

```bash
npm run build
npm start
```
