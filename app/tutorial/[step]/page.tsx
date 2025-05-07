"use client";
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CloseOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import  "@/styles/tutorial.css";

const { Title, Paragraph } = Typography;

// Silky smooth transition animations
/* const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '50%' : '-50%',
    opacity: 0.5,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 120,
      mass: 0.5,
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-30%' : '30%',
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  })
}; */

const TUTORIAL_STEPS = [
  {
    title: "Welcome to MainHunt!",
    content: (
      <>
        <Paragraph className="tutorial-text">Press <span className="text-blue-500">CREATE GAME</span> to start or join an available game in the lobby.</Paragraph>
        <Paragraph className="tutorial-text">Give your game a name and wait for at least <span className="text-orange-500">3 players</span> to begin.</Paragraph>
        <img 
          src="/tutorial/newgame_lobby.png" 
          alt="New Game Lobby" 
          style={{ 
            width: '100%', 
            maxWidth: '500px', 
            margin: '10px auto', 
            display: 'block',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }} 
        />
      </>
    )
  },
  {
    title: "Game Setup",
    content: (
      <>
        <Paragraph className="tutorial-text">Below you will see all available players.</Paragraph>
        <img 
          src="/tutorial/available_players.png" 
          alt="New Game Lobby" 
          style={{ 
            width: '100%', 
            maxWidth: '500px', 
            margin: '10px auto', 
            display: 'block',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }} 
        />
        <Paragraph className="tutorial-text">The <span className="text-red-500">marker is you</span> and the game radius is created around the <span className="text-red-500">hunter</span>!</Paragraph>
      </>
    )
  },
  {
    title: "Hunter & Hiders",
    content: (
      <>
        <Paragraph className="tutorial-text"><span className="text-red-500">Hunters</span> must find all players!</Paragraph>
        <Paragraph className="tutorial-text"><span className="text-blue-500">Hiders</span> must avoid the hunter.</Paragraph>
        <Paragraph className="tutorial-text">Hunters can use <span className="text-purple-500">power-ups</span> to see all players for 10s!</Paragraph>
      </>
    )
  },
  {
    title: "Game Dynamics",
    content: (
      <>
        <Paragraph className="tutorial-text">When a player is caught, the <span className="text-yellow-500">game radius shrinks</span>!</Paragraph>
        <Paragraph className="tutorial-text"><span className="text-green-500">45s</span> preparation time + <span className="text-green-500">60s</span> main game.</Paragraph>
        <Paragraph className="tutorial-text text-purple-500">Enjoy the hunt!</Paragraph>
      </>
    )
  }
];

export default function TutorialPage({ params }: { params: { step: string } }) {
  const router = useRouter();
  const currentStep = parseInt(params.step) - 1;
  const stepData = TUTORIAL_STEPS[currentStep];

  if (!stepData) {
    router.push('/overview');
    return null;
  }

  return (
    <div className="tutorial-container">
      {/* Exit Button */}
      <Button 
        icon={<CloseOutlined />}
        onClick={() => router.push('/overview')}
        className="tutorial-close-button"
        shape="circle"
      />

      <div className="tutorial-content">
        <div className="tutorial-card">
          {/* Slideshow Content */}
          <div className="tutorial-slide-container">
            <AnimatePresence mode="wait">
              <motion.div
                key={params.step}
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
                <Button className="tutorial-button" icon={<ArrowLeftOutlined />}>Previous</Button>
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
                <Button type="primary" className="tutorial-button" icon={<ArrowRightOutlined />}>Next</Button>
              </Link>
            ) : (
              <Button type="primary" className="tutorial-button" onClick={() => router.push('/overview')}>
                Start Playing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}