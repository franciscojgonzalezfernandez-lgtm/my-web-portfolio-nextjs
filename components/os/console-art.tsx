"use client";

import { useEffect } from "react";

// Greeting for visitors who open the devtools console.
const CONSOLE_ART = String.raw`
       ___  ________  ___      ___ ___
      |\  \|\   __  \|\  \    /  /|\  \
      \ \  \ \  \|\  \ \  \  /  / | \  \
    __ \ \  \ \   __  \ \  \/  / / \ \  \
   |\  \\_\  \ \  \ \  \ \    / /   \ \  \
   \ \________\ \__\ \__\ \__/ /     \ \__\
    \|________|\|__|\|__|\|__|/       \|__|

   Curious how this works? Type "help" in the Terminal app,
   or say hi: franciscojgonzalezfernandez@gmail.com
`;

const CONSOLE_ART_STYLE = "font-family: monospace; font-size: 12px; line-height: 1.2; color: #0a84ff;";

let hasLoggedConsoleArt = false;

const ConsoleArt = () => {
  useEffect(() => {
    if (hasLoggedConsoleArt) {
      return;
    }

    hasLoggedConsoleArt = true;
    console.log(`%c${CONSOLE_ART}`, CONSOLE_ART_STYLE);
  }, []);

  return null;
};

export default ConsoleArt;
