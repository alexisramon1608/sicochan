// client-script.ts
// TypeScript client module that monitors new posts and provides full control over post components
import { createDinoGame } from './DinoGame';

interface Post {
  id: number;
  timestamp: string;
  postNumber: number;
  image?: {
    url: string;
    filename: string;
    fileSize: string;
    width?: number;
    height?: number;
  };
  video?: {
    url: string;
    filename: string;
    fileSize: string;
    width?: number;
    height?: number;
  };
  text: string;
  isOP?: boolean;
  threadName?: string;
}

interface ClientAPI {
  onNewPost: (callback: (post: Post, allPosts: Post[]) => void) => void;
  getAllPosts: () => Post[];
  getPostElement: (postId: number) => HTMLElement | null;
  modifyPost: (postId: number, modifications: PostModifications) => void;
}

interface PostModifications {
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontSize?: string;
  fontWeight?: string;
  opacity?: string;
  transform?: string;
  text?: string;
  [key: string]: string | undefined;
}

declare global {
  interface Window {
    ImageBoardAPI?: ClientAPI;
    ImageBoardClient?: ImageBoardClient;
  }
}

function getRandomHueConstantSVColor(s: number, v: number): string {
  const h: number = Math.random() * 360; // Hue: 0 to 359.99... degrees

  let r: number, g: number, b: number;

  // HSV to RGB conversion algorithm
  if (s === 0) {
      r = g = b = v; // Achromatic (gray)
  } else {
      const i = Math.floor(h / 60);
      const f = (h / 60) - i;
      const p = v * (1 - s);
      const q = v * (1 - s * f);
      const t = v * (1 - s * (1 - f));

      switch (i % 6) { // Determine R, G, B based on the hue sector
          case 0: r = v; g = t; b = p; break;
          case 1: r = q; g = v; b = p; break;
          case 2: r = p; g = v; b = t; break;
          case 3: r = p; g = q; b = v; break;
          case 4: r = t; g = p; b = v; break;
          case 5: r = v; g = p; b = q; break;
          default: // Should not be reached if h is between 0 and 360
              r = g = b = 0;
      }
  }

  // Convert RGB from [0,1] to [0,255]
  const r255 = Math.round(r * 255);
  const g255 = Math.round(g * 255);
  const b255 = Math.round(b * 255);

  // Helper to convert a color component to its 2-digit hex representation
  const toHex = (c: number): string => {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
  };

  // Construct the hex string
  return `#${toHex(r255)}${toHex(g255)}${toHex(b255)}`;
}

export class ImageBoardClient {
  private api: ClientAPI | null = null;
  private isRunning: boolean = false;
  private allPosts: Post[] = [];
  private rainbowPartyActive: boolean = false;
  private miataGameActive: boolean = false;

  private partyAudio: HTMLAudioElement | null = null;
  private rainbowInterval: number | null = null;
  private eventLoopInterval: number | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // Wait for the ImageBoard API to be available
    if (window.ImageBoardAPI) {
      this.api = window.ImageBoardAPI;
      this.startMonitoring();
    } else {
      // Listen for the ready event
      (window as any).addEventListener('imageboardReady', (event: CustomEvent) => {
        this.api = event.detail;
        this.startMonitoring();
      });
    }
  }

  private startMonitoring(): void {
    console.log('🚀 ImageBoard Client Script Started');
    console.log('📊 Available API methods:', this.api ? Object.keys(this.api) : []);
    
    this.isRunning = true;
    
    // Get initial posts
    if (this.api) {
      this.allPosts = this.api.getAllPosts();      
      // Set up new post monitoring
      this.api.onNewPost((newPost: Post, allPosts: Post[]) => {
        this.handleNewPost(newPost, allPosts);
      });
    }
    
    // Start the event loop
    this.startEventLoop();
  }

  private handleNewPost(newPost: Post, allPosts: Post[]): void {
    this.allPosts = allPosts;
    
    this.customPostAnalysis(newPost, allPosts);
  }

  private customPostAnalysis(newPost: Post, allPosts: Post[]): void {
    if (!this.api) return;

    // rainbow party keywords
    const keywords = ['sturdy'];
    const foundKeywords = keywords.filter(keyword => 
      newPost.text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (foundKeywords.length > 0) {
      console.log('🎉 RAINBOW PARTY ACTIVATED! Keywords found:', foundKeywords);
      this.startRainbowParty(allPosts);
    }

    const keywords2 = ['miata'];
    const foundKeywords2 = keywords2.filter(keyword2 => 
      newPost.text.toLowerCase().includes(keyword2.toLowerCase())
    );

    if (foundKeywords2.length > 0 && !this.miataGameActive)  {
      this.miataGameActive = true;
      console.log("MIATA GAME");
            // Stop existing audio if playing
            if (this.partyAudio) {
              this.partyAudio.pause();
              this.partyAudio = null;
            }
      
            this.partyAudio = new Audio('https://kappa.vgmsite.com/soundtracks/mario-kart-wii/zpswxcjvfn/28.%20Coconut%20Mall.mp3');
            this.partyAudio.volume = 0.7;
            this.partyAudio.loop = true;
            
            const playPromise = this.partyAudio.play();
            
            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log('🎵 Party music started!');
              }).catch(error => {
                console.log('🎵 Could not play party music (user interaction required):', error);
              });
            }
      createDinoGame();
    }
    


  }


  private createDiscoBall(): void {
    // Remove existing disco ball if any
    const existingDiscoBall = document.getElementById('disco-ball');
    if (existingDiscoBall) {
      existingDiscoBall.remove();
    }
  
    const discoBall = document.createElement('div');
    discoBall.id = 'disco-ball';
    discoBall.className = 'disco-ball';
    document.body.appendChild(discoBall);
  
    // Create some light reflections
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const light = document.createElement('div');
        light.className = 'disco-ball-light';
        document.body.appendChild(light);
        
        // Remove light after animation
        setTimeout(() => light.remove(), 1500);
      }, i * 300);
    }
  }

  private startRainbowParty(allPosts: Post[]): void {
    if (this.rainbowPartyActive) return; // Prevent multiple parties
    
    this.rainbowPartyActive = true;
    console.log('🌈 Starting Rainbow Party Sequence!');

    // Step 1: Create pitch black overlay
    this.createBlackOverlay();

    // Step 2: After 1.5 seconds, replace with spotlight and start party
    setTimeout(() => {
      this.replaceWithSpotlight();
      this.createDiscoBall(); 
      this.startRainbowEffect(allPosts);
      this.playPartyMusic();
    }, 1500);
  }

  private createBlackOverlay(): void {
    // Remove existing overlay if any
    const existingOverlay = document.getElementById('rainbow-party-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    document.body.style.backgroundColor = "#000000";
    const overlay2 = document.createElement('div');
    overlay2.id = 'sturdychan';
    overlay2.className = 'sturdychan';
    document.body.appendChild(overlay2);
    const overlay = document.createElement('div');
    overlay.id = 'rainbow-party-overlay';
    overlay.className = 'rainbow-party-black-overlay';
    document.body.appendChild(overlay);

    // Trigger animation
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);
  }

  private replaceWithSpotlight(): void {
    const overlay = document.getElementById('rainbow-party-overlay');
    const sturdychan = document.getElementById('sturdychan');

    if (overlay && sturdychan) {
      overlay.className = 'rainbow-party-spotlight-overlay';
      overlay.style.backgroundImage = 'url(https://i.imgur.com/FryAu78.gif)';
      sturdychan.style.backgroundImage = 'url(https://i.imgur.com/q4yTu10.gif)';
      sturdychan.style.zIndex = "100000";
    }
  }

  private startRainbowEffect(allPosts: Post[]): void {
    // Clear existing interval if running
    if (this.rainbowInterval !== null) {
      clearInterval(this.rainbowInterval);
    }

    // Initial color change
    this.changeAllPostColors(allPosts);

    // Set up interval for continuous rainbow effect
    this.rainbowInterval = window.setInterval(() => {
      if (this.rainbowPartyActive) {
        this.changeAllPostColors(allPosts);
      } else {
        // Stop the interval if party is no longer active
        if (this.rainbowInterval !== null) {
          clearInterval(this.rainbowInterval);
          this.rainbowInterval = null;
        }
      }
    }, 1000);
  }

  private changeAllPostColors(allPosts: Post[]): void {
    if (!this.api) return;

    const prompts: string[] = [
      "DANCE DANCEEE!!!",
      "WOOOOOOHOOOOOOOOOOOOOOOOOOOOOOOO",
      "TS A PARTY!!!!!!!!!!!!!!!!!!!",
      "WE ALL CRACKIN ADMINNY",
      "I MIGHT BE A NEGGER BUT EVEN I CAN FEEL THE RHYTHM",
      "JUST LIKE MY DANCEFUs",
      "HIT IT STURDY-CHAN",
      "HOME ALONE ON A FRIDAY NIGHT?",
      "CHECK THESE MOVES",
      "ALRIGHT ALRIGHT, I CANT BE NONCHALANT CAN I?",
      "ON EVERYONE'S SOUL WE HITTING THIS!!!!!",
      "NEGGERS SYBAUUUU",
      "CALL THIS THE PARASOCIAL SHUFFLE",
      "FIRST TIME OUTSIDE IN 8 YEARS!!!"
    ];
  

    document.body.style.backgroundColor = getRandomHueConstantSVColor(.9, .08);
    for (let post of allPosts) {
      const newColor = getRandomHueConstantSVColor(.4, 1);
      const randomIndex: number = Math.floor(Math.random() * prompts.length);
      this.api.modifyPost(post.id, {
        backgroundColor: newColor,
        text: prompts[randomIndex],
        fontSize: "20px"
      });

    }
  }

  private playPartyMusic(): void {
    try {
      // Stop existing audio if playing
      if (this.partyAudio) {
        this.partyAudio.pause();
        this.partyAudio = null;
      }

      this.partyAudio = new Audio('https://dn720301.ca.archive.org/0/items/caramelldansen-speedycake-remix/Caramelldansen%20%28speedycake%20remix%29.mp3');
      this.partyAudio.volume = 0.7;
      this.partyAudio.loop = true;
      
      const playPromise = this.partyAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('🎵 Party music started!');
        }).catch(error => {
          console.log('🎵 Could not play party music (user interaction required):', error);
        });
      }
    } catch (error) {
      console.log('🎵 Error playing party music:', error);
    }
  }

  // Public method to stop rainbow party
  public stopRainbowParty(): void {
    console.log('🛑 Stopping Rainbow Party!');
    this.rainbowPartyActive = false;
    
    // Clear rainbow interval
    if (this.rainbowInterval !== null) {
      clearInterval(this.rainbowInterval);
      this.rainbowInterval = null;
    }
    
    // Stop party music
    if (this.partyAudio) {
      this.partyAudio.pause();
      this.partyAudio = null;
    }
    
    // Remove overlays
    const overlay = document.getElementById('rainbow-party-overlay');
    const sturdychan = document.getElementById('sturdychan');
    const discoBall = document.getElementById('disco-ball');
    
    if (overlay) overlay.remove();
    if (sturdychan) sturdychan.remove();
    if (discoBall) discoBall.remove();
    
    // Reset body background
    document.body.style.backgroundColor = '';
  }

  // Public method to manually trigger rainbow party
  public triggerRainbowParty(): void {
    console.log('🎉 Manually triggering Rainbow Party!');
    this.startRainbowParty(this.allPosts);
  }

  // Event loop for continuous monitoring
  private startEventLoop(): void {
    const eventLoop = (): void => {
      if (!this.isRunning || !this.api) {
        // Clear the interval if stopping
        if (this.eventLoopInterval !== null) {
          clearTimeout(this.eventLoopInterval);
          this.eventLoopInterval = null;
        }
        return;
      }
      
      // Get current posts
      const currentPosts = this.api.getAllPosts();
      
      // Check if posts have changed (length comparison is sufficient for this demo)
      if (currentPosts.length !== this.allPosts.length) {
        console.log('🔄 Post count changed, updating local cache');
        this.allPosts = currentPosts;
      }
      
      // Continue the loop
      this.eventLoopInterval = window.setTimeout(eventLoop, 1000); // Check every second
    };
    
    eventLoop();
  }

  // Public method to stop monitoring
  public stop(): void {
    console.log('🛑 Stopping ImageBoard Client');
    this.isRunning = false;
    
    // Clear event loop interval
    if (this.eventLoopInterval !== null) {
      clearTimeout(this.eventLoopInterval);
      this.eventLoopInterval = null;
    }
    
    // Stop rainbow party if active
    if (this.rainbowPartyActive) {
      this.stopRainbowParty();
    }
  }

  // Public utility methods for external access
  public getAllPosts(): Post[] {
    return this.allPosts;
  }
  
  public getPostById(postId: number): Post | undefined {
    return this.allPosts.find(post => post.id === postId);
  }
  
  public getPostElement(postId: number): HTMLElement | null {
    return this.api?.getPostElement(postId) || null;
  }
  
  public modifyPost(postId: number, modifications: PostModifications): void {
    if (this.api) {
      this.api.modifyPost(postId, modifications);
      console.log(`✏️  Modified post ${postId}:`, modifications);
    }
  }
  
  // Advanced filtering methods
  public getPostsWithImages(): Post[] {
    return this.allPosts.filter(post => post.image);
  }

  public getPostsWithVideos(): Post[] {
    return this.allPosts.filter(post => post.video);
  }

  public getPostsWithText(searchText: string): Post[] {
    return this.allPosts.filter(post => 
      post.text.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  public getPostsByPostNumber(postNumbers: number[]): Post[] {
    return this.allPosts.filter(post => postNumbers.includes(post.postNumber));
  }
}

// Auto-initialize and expose to global scope
const imageBoardClient = new ImageBoardClient();
if (typeof window !== 'undefined') {
  window.ImageBoardClient = imageBoardClient;
}

export default imageBoardClient;