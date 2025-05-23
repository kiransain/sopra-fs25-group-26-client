"use client";
import { Button, Typography, Tag } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import "@/styles/tutorial.css";
import { useAudio } from "@/hooks/useAudio";
import Image from 'next/image';



const { Title } = Typography;

const TUTORIAL_STEPS = [
  {
    title: "Welcome to Manhunt",
    content: (
      <div className="tutorial-page">
        <div className="tutorial-text-block">
          <p>Manhunt brings the thrill of outdoor hide-and-seek into the digital age by combining physical gameplay with mobile technology. Our mission is to make outdoor play exciting again while using location features to enhance the experience.</p>
          
          <div className="flex justify-center my-4">
            <div className="w-full max-w-md">
              <Image
                src="/tutorial/newgame_overview.png"
                alt="Game overview screen"
                width={436/1.2}
                height={142/1.2}
                className="rounded-lg border border-gray-200 shadow-md w-full h-auto"
                priority
              />
            </div>
          </div>

          <p>You have already found the overview page - great start! From here you can join existing games or create your own adventure. Tap your profile icon to view your statistics, see where you rank on the leaderboard, or update your account settings.</p>
        </div>
      </div>
    )
  },
  {
    title: "Creating Your Game",
    content: (
      <div className="tutorial-page">
        <div className="tutorial-text-block">
          <p>To start a new game, tap the Create button. This will open the game customization screen where you can set up your perfect Manhunt experience.</p>

          <div className="flex justify-center my-4">
            <div className="w-full max-w-md">
              <Image
                src="/screenshots/create_game.jpg"
                alt="Game creation screen"
                width={1179/4}
                height={2150/4}
                className="rounded-lg border border-gray-200 shadow-md w-full h-auto"
              />
            </div>
          </div>

          <p>Customize three key elements: First, adjust your play area - this determines how much ground your game will cover. Second, set the preparation time - this gives hiders time to find good hiding spots. Finally, choose your main game duration - this is how long the hunter has to find everyone.</p>
        </div>
      </div>
    )
  },
  {
    title: "Game Preparation",
    content: (
      <div className="tutorial-page">
        <div className="tutorial-text-block">
          <p>Once your game has at least two players, you can begin. The preparation phase starts immediately, giving hiders precious time to scatter and hide while the hunter waits.</p>

          <div className="flex justify-center my-4">
            <div className="w-full max-w-md">
              <Image
                  src="/screenshots/main-game-preparation.jpg"
                  alt="Preparation timer screen"
                  width={1179/4}
                  height={2152/4}
                  className="rounded-lg border border-gray-200 shadow-md w-full h-auto"
              />
            </div>
          </div>

          <p>
            During this phase, check the top right corner of your screen to see the preparation timer counting down. You will also see your randomly assigned role - either{' '}
            <span className="text-purple-600 font-bold">hunter</span>{' '}
            (purple) or{' '}
            <span className="text-yellow-500 font-bold">hider</span>{' '}
            (yellow). Use this time wisely -{' '}
            <span className="text-yellow-500 font-bold">hiders</span> should find good concealment while the{' '}
            <span className="text-purple-600 font-bold">hunter</span> plans their search strategy.
          </p>

        </div>
      </div>
    )
  },
  {
    title: "Main Gameplay",
    content: (
      <div className="tutorial-page">
        <div className="tutorial-text-block">
          <p>When preparation ends, the main game timer begins. Your red map marker shows your current location and updates as you move. The red circle marks the play area boundary - stay inside it to remain in the game.</p>

          <div className="flex justify-center my-4">
            <div className="w-full max-w-md"> {/* Slightly wider for maps */}
              <Image
                src="/screenshots/main-game.jpg"
                alt="Game map screen"
                width={1179/4}
                height={2152/4}
                className="rounded-lg border border-gray-200 shadow-md w-full h-auto"
              />
            </div>
          </div>

          <p>
            As the <span className="text-purple-600 font-bold">hunter</span>, your goal is simple: find and tag all <span className="text-yellow-500 font-bold">hiders</span>. As a <span className="text-yellow-500 font-bold">hider</span>, your objective is to avoid detection until time runs out. The game becomes more intense as caught players are eliminated and the play area shrinks accordingly.
          </p>
        </div>
      </div>
    )
  },
  {
    title: "Power-ups & Special Rules",
    content: (
      <div className="tutorial-page">
        <div className="tutorial-text-block">
          <p>
            Manhunt includes special power-ups to keep gameplay dynamic. All players receive one use of the{' '}
            <span className="text-purple-600 font-bold">
              reveal
            </span>{' '}
            ability, which shows all player locations for 10 seconds - use it strategically!
          </p>

          <div className="flex justify-center my-4">
            <div className="w-full max-w-md">
              <Image
                src="/tutorial/powerup.png"
                alt="Power-up screen"
                width={620/3}
                height={287/3}
                className="rounded-lg border border-gray-200 shadow-md w-full h-auto"
              />
            </div>
          </div>

          <p>
            Hunters get an additional ability: they can{' '}
            <span className="text-red-500 font-bold">
              recenter
            </span>{' '}
            the play area based on their current location. This can be crucial when the original center becomes less relevant to the ongoing hunt.
          </p>

          <p>If you accidentally leave the play area, you will receive a 10-second warning to return before automatic elimination. This keeps the action focused while allowing for occasional boundary mistakes.</p>
          
          <div className="flex justify-center my-4">
            <div className="w-full max-w-md">
              <Image
                src="/screenshots/outOfArea.jpg"
                alt="Boundary warning screen"
                width={1179/4}
                height={2152/4}
                className="rounded-lg border border-gray-200 shadow-md w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Game Conclusion",
    content: (
      <div className="tutorial-page">
        <div className="tutorial-text-block">
          <p>The game ends in one of two ways: either the hunter successfully catches all hiders, or the main game timer expires with hiders still remaining. In both cases, players are shown the results screen with statistics from the match.</p>

          <div className="flex justify-center my-4">
            <div className="w-full max-w-md">
              <Image
                src="/screenshots/leaderboard.jpg"
                alt="Game results screen"
                width={1179/4}
                height={2152/4}
                className="rounded-lg border border-gray-200 shadow-md w-full h-auto"
              />
            </div>
          </div>

          <p>Remember these troubleshooting tips if you encounter issues: For location problems, try refreshing the app or moving to a more open area. If you experience lobby issues, exit and rejoin the game. Most importantly, get outside, move around, and enjoy this modern twist on a classic game!</p>
        </div>
      </div>
    )
  }
];



export default function TutorialPage({ params }: { params: Promise<{ step: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params); 
  const currentStep = parseInt(resolvedParams.step) - 1;
  const stepData = TUTORIAL_STEPS[currentStep];
  const playClick = useAudio('/sounds/button-click.mp3', 0.3);

  if (!stepData) {
    router.push('/overview');
    return null;
  }

  return (
    <div className="tutorial-container">
      {/* Header Bar - Matches profile style */}
      <header className="tutorial-header">
        {/* Exit arrow near header */}
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() =>{playClick(); router.push('/overview');}}
            className="tutorial-back-button"
            type="text"
            size="large"
          />
        <Title level={3} className="tutorial-header-title">Game Tutorial</Title>
        <Tag color="purple" className="tutorial-step-tag">
          Step {currentStep + 1}/{TUTORIAL_STEPS.length}
        </Tag>
      </header>

      <div className="tutorial-content">
        <div className="tutorial-card">
          {/* Slideshow Content */}
          <div className="tutorial-slide-container">
            <AnimatePresence mode="wait">
              <motion.div
                key={resolvedParams.step}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: 0.2, type: 'spring'}}
                className="text-center max-w-md w-full"
              >
                <Title level={2} className="tutorial-title">{stepData.title}</Title>
                <div className="tutorial-text-container">
                  {stepData.content}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <div className="tutorial-navigation">
          <div>
            {currentStep > 0 && (
              <Link href={`/tutorial/${currentStep}`}>
                <Button className="tutorial-button" onClick={() => playClick()} icon={<ArrowLeftOutlined />}>Previous</Button>
              </Link>
            )}
          </div>

          <div className="tutorial-dots">
            {TUTORIAL_STEPS.map((_, i) => (
              <Link key={i} href={`/tutorial/${i + 1}`}>
                <div className={`w-2 h-2 rounded-full ${currentStep === i ? 'bg-blue-500' : 'bg-gray-300'}`} />
              </Link>
            ))}
          </div>

          <div>
            {currentStep < TUTORIAL_STEPS.length - 1 ? (
              <Link href={`/tutorial/${currentStep + 2}`}>
                <Button type="primary" className="tutorial-button" onClick={() => playClick()} icon={<ArrowRightOutlined />}>Next</Button>
              </Link>
            ) : (
              <Button type="primary" className="tutorial-button" onClick={() => {playClick(); router.push('/overview');}}>
                Start Playing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}