import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { offlineStorage } from '@/lib/offlineStorage';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

import type { NoteWithSharing, NoteType } from '@/types/sharing';

export type Note = NoteWithSharing;

export type WritingPrompt = {
  id: string;
  text: string;
  category?: 'reflection' | 'creative' | 'gratitude' | 'growth' | 'healing';
};

type NoteContextType = {
  notes: Note[];
  currentNote: Note | null;
  writingPrompts: WritingPrompt[];
  dailyPrompts: WritingPrompt[];
  loading: boolean;
  hasInitialLoad: boolean;
  addNote: (noteType?: NoteType) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>, silent?: boolean) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<Note | null>;
  togglePinNote: (id: string) => Promise<void>;
  getNote: (id: string) => Note | undefined;
  setCurrentNote: (note: Note | null) => void;
  getRandomPrompt: () => WritingPrompt;
  refreshDailyPrompts: () => void;
  syncNotes: () => Promise<void>;
};

const defaultPrompts: WritingPrompt[] = [
  // Reflection Prompts (1-50)
  { id: '1', text: "What made you smile today?", category: 'reflection' },
  { id: '2', text: "What's something you're proud of that you rarely share?", category: 'reflection' },
  { id: '3', text: "Describe a moment when you felt completely at peace.", category: 'reflection' },
  { id: '4', text: "What are you learning about yourself right now?", category: 'reflection' },
  { id: '5', text: "What's your earliest memory of feeling joy?", category: 'reflection' },
  { id: '6', text: "Write about something ordinary that suddenly seemed extraordinary.", category: 'reflection' },
  { id: '7', text: "What part of yourself are you still discovering?", category: 'reflection' },
  { id: '8', text: "What fills your cup when you're feeling depleted?", category: 'reflection' },
  { id: '9', text: "Write about a place that feels like home to you.", category: 'reflection' },
  { id: '10', text: "Write about a time you felt truly seen by someone else.", category: 'reflection' },
  { id: '11', text: "What's a lesson you learned the hard way?", category: 'reflection' },
  { id: '12', text: "Describe a moment when you surprised yourself.", category: 'reflection' },
  { id: '13', text: "What's something you believed as a child that you no longer believe?", category: 'reflection' },
  { id: '14', text: "Write about a time when you felt completely authentic.", category: 'reflection' },
  { id: '15', text: "What's the most important thing you've learned about friendship?", category: 'reflection' },
  { id: '16', text: "Describe a moment when you felt truly alive.", category: 'reflection' },
  { id: '17', text: "What's something you thought you wanted but realized you didn't?", category: 'reflection' },
  { id: '18', text: "Write about a time when you felt deeply connected to nature.", category: 'reflection' },
  { id: '19', text: "What's a tradition or ritual that's meaningful to you?", category: 'reflection' },
  { id: '20', text: "Describe a moment when you felt powerful.", category: 'reflection' },
  { id: '21', text: "What's something you've changed your mind about recently?", category: 'reflection' },
  { id: '22', text: "Write about a time when you felt grateful for a difficulty.", category: 'reflection' },
  { id: '23', text: "What's the best advice you've ever received?", category: 'reflection' },
  { id: '24', text: "Describe a moment when you felt truly understood.", category: 'reflection' },
  { id: '25', text: "What's something you do that brings you back to yourself?", category: 'reflection' },
  { id: '26', text: "Write about a time when you felt inspired by someone else.", category: 'reflection' },
  { id: '27', text: "What's a small thing that brings you disproportionate joy?", category: 'reflection' },
  { id: '28', text: "Describe a moment when you felt proud of your growth.", category: 'reflection' },
  { id: '29', text: "What's something you've always wanted to try but haven't?", category: 'reflection' },
  { id: '30', text: "Write about a time when you felt truly relaxed.", category: 'reflection' },
  { id: '31', text: "What's the most important thing you've learned about yourself this year?", category: 'reflection' },
  { id: '32', text: "Describe a moment when you felt curious about the world.", category: 'reflection' },
  { id: '33', text: "What's something you do differently now than you did five years ago?", category: 'reflection' },
  { id: '34', text: "Write about a time when you felt supported by your community.", category: 'reflection' },
  { id: '35', text: "What's a belief about yourself that you've outgrown?", category: 'reflection' },
  { id: '36', text: "Describe a moment when you felt creative.", category: 'reflection' },
  { id: '37', text: "What's something you've forgiven yourself for?", category: 'reflection' },
  { id: '38', text: "Write about a time when you felt brave.", category: 'reflection' },
  { id: '39', text: "What's the most meaningful compliment you've ever received?", category: 'reflection' },
  { id: '40', text: "Describe a moment when you felt deeply loved.", category: 'reflection' },
  { id: '41', text: "What's something you've learned about patience?", category: 'reflection' },
  { id: '42', text: "Write about a time when you felt hopeful.", category: 'reflection' },
  { id: '43', text: "What's a memory that always makes you laugh?", category: 'reflection' },
  { id: '44', text: "Describe a moment when you felt wise.", category: 'reflection' },
  { id: '45', text: "What's something you've learned about letting go?", category: 'reflection' },
  { id: '46', text: "Write about a time when you felt excited about the future.", category: 'reflection' },
  { id: '47', text: "What's the most important thing you've learned about love?", category: 'reflection' },
  { id: '48', text: "Describe a moment when you felt grateful for your body.", category: 'reflection' },
  { id: '49', text: "What's something you've learned about trust?", category: 'reflection' },
  { id: '50', text: "Write about a time when you felt connected to something bigger than yourself.", category: 'reflection' },

  // Growth Prompts (51-100)
  { id: '51', text: "Write a letter to your future self.", category: 'growth' },
  { id: '52', text: "What's a challenge you've overcome recently?", category: 'growth' },
  { id: '53', text: "What boundaries do you need to set or maintain?", category: 'growth' },
  { id: '54', text: "What are you resisting that might actually be good for you?", category: 'growth' },
  { id: '55', text: "What's a truth you're ready to face?", category: 'growth' },
  { id: '56', text: "What do you need permission for right now?", category: 'growth' },
  { id: '57', text: "What limiting belief is holding you back?", category: 'growth' },
  { id: '58', text: "What have you let go of that once seemed important?", category: 'growth' },
  { id: '59', text: "What advice would your future self give you?", category: 'growth' },
  { id: '60', text: "What fear are you ready to face?", category: 'growth' },
  { id: '61', text: "What skill do you want to develop?", category: 'growth' },
  { id: '62', text: "What habit do you want to change?", category: 'growth' },
  { id: '63', text: "What's a risk you're considering taking?", category: 'growth' },
  { id: '64', text: "What's something you want to be more consistent with?", category: 'growth' },
  { id: '65', text: "What's a conversation you need to have?", category: 'growth' },
  { id: '66', text: "What's something you want to learn more about?", category: 'growth' },
  { id: '67', text: "What's a goal you're working toward?", category: 'growth' },
  { id: '68', text: "What's something you want to be more mindful of?", category: 'growth' },
  { id: '69', text: "What's a pattern you want to break?", category: 'growth' },
  { id: '70', text: "What's something you want to be more confident about?", category: 'growth' },
  { id: '71', text: "What's a relationship you want to improve?", category: 'growth' },
  { id: '72', text: "What's something you want to be more patient with?", category: 'growth' },
  { id: '73', text: "What's a strength you want to develop further?", category: 'growth' },
  { id: '74', text: "What's something you want to be more present for?", category: 'growth' },
  { id: '75', text: "What's a value you want to live by more fully?", category: 'growth' },
  { id: '76', text: "What's something you want to be more curious about?", category: 'growth' },
  { id: '77', text: "What's a change you want to make in your daily routine?", category: 'growth' },
  { id: '78', text: "What's something you want to be more grateful for?", category: 'growth' },
  { id: '79', text: "What's a quality you admire in others that you want to cultivate?", category: 'growth' },
  { id: '80', text: "What's something you want to be more honest about?", category: 'growth' },
  { id: '81', text: "What's a mistake you're ready to learn from?", category: 'growth' },
  { id: '82', text: "What's something you want to be more disciplined about?", category: 'growth' },
  { id: '83', text: "What's a comfort zone you're ready to step out of?", category: 'growth' },
  { id: '84', text: "What's something you want to be more intentional about?", category: 'growth' },
  { id: '85', text: "What's a weakness you want to work on?", category: 'growth' },
  { id: '86', text: "What's something you want to be more organized about?", category: 'growth' },
  { id: '87', text: "What's a dream you want to pursue?", category: 'growth' },
  { id: '88', text: "What's something you want to be more creative with?", category: 'growth' },
  { id: '89', text: "What's a challenge you want to embrace?", category: 'growth' },
  { id: '90', text: "What's something you want to be more decisive about?", category: 'growth' },
  { id: '91', text: "What's a project you want to start?", category: 'growth' },
  { id: '92', text: "What's something you want to be more flexible about?", category: 'growth' },
  { id: '93', text: "What's a responsibility you want to embrace?", category: 'growth' },
  { id: '94', text: "What's something you want to be more adventurous with?", category: 'growth' },
  { id: '95', text: "What's a commitment you want to make?", category: 'growth' },
  { id: '96', text: "What's something you want to be more authentic about?", category: 'growth' },
  { id: '97', text: "What's a standard you want to raise for yourself?", category: 'growth' },
  { id: '98', text: "What's something you want to be more vulnerable about?", category: 'growth' },
  { id: '99', text: "What's a legacy you want to create?", category: 'growth' },
  { id: '100', text: "What's something you want to be more courageous about?", category: 'growth' },

  // Gratitude Prompts (101-130)
  { id: '101', text: "List three things you're grateful for today.", category: 'gratitude' },
  { id: '102', text: "Write a thank you note to someone who will never read it.", category: 'gratitude' },
  { id: '103', text: "What surprising thing are you grateful for?", category: 'gratitude' },
  { id: '104', text: "List 5 tiny joys you experienced this week.", category: 'gratitude' },
  { id: '105', text: "Describe a small act of kindness you witnessed or experienced.", category: 'gratitude' },
  { id: '106', text: "What's something difficult you're grateful for?", category: 'gratitude' },
  { id: '107', text: "Write about someone who made your day better.", category: 'gratitude' },
  { id: '108', text: "What's a simple pleasure you're grateful for?", category: 'gratitude' },
  { id: '109', text: "List things about your body you're grateful for.", category: 'gratitude' },
  { id: '110', text: "What's a lesson you're grateful to have learned?", category: 'gratitude' },
  { id: '111', text: "Write about a place you're grateful to have visited.", category: 'gratitude' },
  { id: '112', text: "What's a skill you're grateful to have developed?", category: 'gratitude' },
  { id: '113', text: "List people in your life you're grateful for.", category: 'gratitude' },
  { id: '114', text: "What's a book, movie, or song you're grateful for?", category: 'gratitude' },
  { id: '115', text: "Write about a memory you're grateful to have.", category: 'gratitude' },
  { id: '116', text: "What's something in nature you're grateful for?", category: 'gratitude' },
  { id: '117', text: "List things about your home you're grateful for.", category: 'gratitude' },
  { id: '118', text: "What's a technology you're grateful for?", category: 'gratitude' },
  { id: '119', text: "Write about a teacher who influenced you.", category: 'gratitude' },
  { id: '120', text: "What's a food you're grateful for?", category: 'gratitude' },
  { id: '121', text: "List things about your current season of life you're grateful for.", category: 'gratitude' },
  { id: '122', text: "What's an opportunity you're grateful for?", category: 'gratitude' },
  { id: '123', text: "Write about a friendship you're grateful for.", category: 'gratitude' },
  { id: '124', text: "What's something free that you're grateful for?", category: 'gratitude' },
  { id: '125', text: "List things about your past self you're grateful for.", category: 'gratitude' },
  { id: '126', text: "What's a tradition you're grateful for?", category: 'gratitude' },
  { id: '127', text: "Write about a moment of beauty you're grateful for.", category: 'gratitude' },
  { id: '128', text: "What's something about your personality you're grateful for?", category: 'gratitude' },
  { id: '129', text: "List things about your community you're grateful for.", category: 'gratitude' },
  { id: '130', text: "What's a second chance you're grateful for?", category: 'gratitude' },

  // Creative Prompts (131-160)
  { id: '131', text: "Describe your perfect day.", category: 'creative' },
  { id: '132', text: "If your emotions were weather, what's the forecast today?", category: 'creative' },
  { id: '133', text: "Write a six-word story about your day.", category: 'creative' },
  { id: '134', text: "Create a dialogue between your present self and your past self.", category: 'creative' },
  { id: '135', text: "Describe your day as if it were a scene in your favorite book.", category: 'creative' },
  { id: '136', text: "If your heart could write a letter, what would it say?", category: 'creative' },
  { id: '137', text: "Write a poem about how you're feeling without using any emotion words.", category: 'creative' },
  { id: '138', text: "Create a conversation between two parts of yourself.", category: 'creative' },
  { id: '139', text: "If you could have dinner with anyone, dead or alive, who would it be and why?", category: 'creative' },
  { id: '140', text: "Write about a world where everyone can read minds.", category: 'creative' },
  { id: '141', text: "If you could give one piece of advice to everyone in the world, what would it be?", category: 'creative' },
  { id: '142', text: "Describe your life as a fairy tale.", category: 'creative' },
  { id: '143', text: "Write about a day when gravity stopped working.", category: 'creative' },
  { id: '144', text: "If you could live in any time period, when would you choose?", category: 'creative' },
  { id: '145', text: "Write a story that begins with 'The last person on Earth heard a knock at the door.'", category: 'creative' },
  { id: '146', text: "If you could have any superpower, what would it be and how would you use it?", category: 'creative' },
  { id: '147', text: "Describe a secret garden only you know about.", category: 'creative' },
  { id: '148', text: "Write about a character who can taste colors.", category: 'creative' },
  { id: '149', text: "If you could redesign the human body, what would you change?", category: 'creative' },
  { id: '150', text: "Write about a library that contains books about everyone's lives.", category: 'creative' },
  { id: '151', text: "Describe your ideal creative space.", category: 'creative' },
  { id: '152', text: "Write about a world where music is illegal.", category: 'creative' },
  { id: '153', text: "If you could invent a new holiday, what would it celebrate?", category: 'creative' },
  { id: '154', text: "Write about someone who collects forgotten memories.", category: 'creative' },
  { id: '155', text: "Describe a city built entirely in the clouds.", category: 'creative' },
  { id: '156', text: "Write about a character who can see the lifespan of objects.", category: 'creative' },
  { id: '157', text: "If you could communicate with one species of animal, which would you choose?", category: 'creative' },
  { id: '158', text: "Write about a world where everyone has to tell the truth.", category: 'creative' },
  { id: '159', text: "Describe what happens when someone finds a door that leads to yesterday.", category: 'creative' },
  { id: '160', text: "Write about a character who can only speak in questions.", category: 'creative' },

  // Healing Prompts (161-200)
  { id: '161', text: "Write about a memory that makes you feel loved.", category: 'healing' },
  { id: '162', text: "What would you say to yourself as a child?", category: 'healing' },
  { id: '163', text: "If your body could speak, what would it say?", category: 'healing' },
  { id: '164', text: "What are you avoiding facing right now?", category: 'healing' },
  { id: '165', text: "What does your inner critic say, and how would you respond with kindness?", category: 'healing' },
  { id: '166', text: "Write a love letter to your body.", category: 'healing' },
  { id: '167', text: "What's something you need to hear right now?", category: 'healing' },
  { id: '168', text: "What relationship in your life needs attention?", category: 'healing' },
  { id: '169', text: "Write about a time when you felt supported during a difficult moment.", category: 'healing' },
  { id: '170', text: "What's something you've been holding onto that you're ready to release?", category: 'healing' },
  { id: '171', text: "Write about a part of yourself you've been rejecting.", category: 'healing' },
  { id: '172', text: "What's a wound that's ready to heal?", category: 'healing' },
  { id: '173', text: "Write about your relationship with your parents.", category: 'healing' },
  { id: '174', text: "What's something you need to forgive yourself for?", category: 'healing' },
  { id: '175', text: "Write about a time when you felt misunderstood.", category: 'healing' },
  { id: '176', text: "What's a pattern in your relationships you want to change?", category: 'healing' },
  { id: '177', text: "Write about your relationship with your emotions.", category: 'healing' },
  { id: '178', text: "What's something you've been avoiding that needs your attention?", category: 'healing' },
  { id: '179', text: "Write about a time when you felt truly accepted.", category: 'healing' },
  { id: '180', text: "What's a fear you're ready to examine?", category: 'healing' },
  { id: '181', text: "Write about your relationship with change.", category: 'healing' },
  { id: '182', text: "What's something you've learned about resilience?", category: 'healing' },
  { id: '183', text: "Write about a time when you felt empowered.", category: 'healing' },
  { id: '184', text: "What's something you want to be gentler with yourself about?", category: 'healing' },
  { id: '185', text: "Write about your relationship with perfectionism.", category: 'healing' },
  { id: '186', text: "What's a story you tell yourself that you're ready to change?", category: 'healing' },
  { id: '187', text: "Write about a time when you showed yourself compassion.", category: 'healing' },
  { id: '188', text: "What's something you've learned about boundaries?", category: 'healing' },
  { id: '189', text: "Write about your relationship with asking for help.", category: 'healing' },
  { id: '190', text: "What's something you want to celebrate about your journey?", category: 'healing' },
  { id: '191', text: "Write about a time when you felt truly safe.", category: 'healing' },
  { id: '192', text: "What's something you've learned about self-worth?", category: 'healing' },
  { id: '193', text: "Write about your relationship with vulnerability.", category: 'healing' },
  { id: '194', text: "What's a limiting belief you're ready to release?", category: 'healing' },
  { id: '195', text: "Write about a time when you felt truly free.", category: 'healing' },
  { id: '196', text: "What's something you want to honor about your past?", category: 'healing' },
  { id: '197', text: "Write about your relationship with your intuition.", category: 'healing' },
  { id: '198', text: "What's something you've learned about self-care?", category: 'healing' },
  { id: '199', text: "Write about a time when you felt deeply connected to yourself.", category: 'healing' },
  { id: '200', text: "What's a gift you want to give yourself?", category: 'healing' },
];

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [writingPrompts] = useState<WritingPrompt[]>(defaultPrompts);
  const [dailyPrompts, setDailyPrompts] = useState<WritingPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOfflineStatus();

  // Load notes when user changes
  useEffect(() => {
    console.log('NoteContext useEffect: user changed', { hasUser: !!user });
    if (user) {
      console.log('NoteContext useEffect: calling loadNotes');
      setHasInitialLoad(false); // Reset initial load state when user changes
      loadNotes();
    } else {
      console.log('NoteContext useEffect: no user, clearing state');
      setNotes([]);
      setCurrentNote(null);
      setLoading(false);
      setHasInitialLoad(false); // Reset when user logs out
    }
  }, [user]);

  // Set up real-time subscriptions (throttled to reduce load)
  useEffect(() => {
    if (!user) return;

    // Debounce loadNotes to prevent excessive calls
    let reloadTimeout: ReturnType<typeof setTimeout> | null = null;
    const throttledReload = () => {
      if (reloadTimeout) return;
      reloadTimeout = setTimeout(() => {
        loadNotes();
        reloadTimeout = null;
      }, 2000); // Throttle to max once every 2 seconds
    };

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'shared_notes',
          filter: `shared_with_user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Share access removed:', payload);
          const noteId = payload.old?.note_id;
          if (noteId) {
            setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
            setCurrentNote(prevNote => 
              prevNote && prevNote.id === noteId ? null : prevNote
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shared_notes',
          filter: `shared_with_user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New share access granted:', payload);
          throttledReload();
        }
      )
      .subscribe();

    return () => {
      if (reloadTimeout) clearTimeout(reloadTimeout);
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Listen for sync-after-offline event
  useEffect(() => {
    const handleSyncAfterOffline = () => {
      if (user && isOnline) {
        console.log('Syncing notes after coming back online...');
        loadNotes();
        toast({
          title: "Notes synced",
          description: "Your notes have been synced with the server.",
        });
      }
    };

    window.addEventListener('sync-after-offline', handleSyncAfterOffline);
    return () => {
      window.removeEventListener('sync-after-offline', handleSyncAfterOffline);
    };
  }, [user, isOnline]);

  const loadNotes = async () => {
    console.log('loadNotes: Starting, setting loading to true');
    setLoading(true);
    
    if (!user) {
      console.log('loadNotes: No user, returning early');
      setLoading(false);
      return;
    }

    try {
      // First, always load from offline storage immediately
      const offlineNotes = await offlineStorage.loadNotes(user.id);
      console.log('loadNotes: Loaded offline notes:', offlineNotes.length);
      
      if (offlineNotes.length > 0) {
        setNotes(offlineNotes);
        console.log('loadNotes: Set notes from offline storage');
      }

      // If offline, just use the cached notes and stop here
      if (!isOnline) {
        console.log('loadNotes: Offline mode, using cached notes only');
        if (offlineNotes.length > 0) {
          toast({
            title: "Working offline",
            description: "Showing cached notes. Changes will sync when online.",
          });
        }
        setLoading(false);
        setHasInitialLoad(true);
        return;
      }

      console.log('loadNotes: Online mode, loading from Supabase...');
      
      // Load owned notes, shared notes, and owned notes shares in parallel
      const [ownedNotesResponse, sharedNotesResponse, ownedNotesSharesResponse] = await Promise.all([
        // Get notes owned by the user
        supabase
          .from('notes')
          .select('*')
          .eq('user_id', user!.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false }),
          
        // Get ALL shared notes for this user (both by user_id AND email)
        supabase
          .from('shared_notes')
          .select(`
            note_id,
            permission,
            notes!inner(
              id,
              title,
              content,
              created_at,
              updated_at,
              featured_image,
              user_id
            )
          `)
          .or(`shared_with_user_id.eq.${user!.id},shared_with_email.eq.${user!.email}`)
          .is('notes.deleted_at', null),
          
        // Get all shares for notes owned by the user
        supabase
          .from('shared_notes')
          .select('*')
          .eq('owner_id', user!.id)
      ]);

      console.log('loadNotes: Responses received', {
        ownedNotesError: ownedNotesResponse.error,
        ownedNotesCount: ownedNotesResponse.data?.length || 0,
        sharedNotesError: sharedNotesResponse.error,
        sharedNotesCount: sharedNotesResponse.data?.length || 0
      });

      if (ownedNotesResponse.error) {
        console.error('Error loading owned notes from Supabase:', ownedNotesResponse.error);
      }

      if (sharedNotesResponse.error) {
        console.error('Error loading shared notes from Supabase:', sharedNotesResponse.error);
      }

      // Combine owned and shared notes
      const ownedNotes = ownedNotesResponse.data || [];
      const sharedNotesData = sharedNotesResponse.data || [];
      
      console.log('Shared notes data:', sharedNotesData);

      // Get the shares data for owned notes
      const ownedNotesShares = ownedNotesSharesResponse.data || [];
      
      // Create a map of note_id to shares for quick lookup
      const sharesMap = new Map<string, any[]>();
      ownedNotesShares.forEach(share => {
        if (!sharesMap.has(share.note_id)) {
          sharesMap.set(share.note_id, []);
        }
        sharesMap.get(share.note_id)!.push(share);
      });

      // Format notes from Supabase
      const formattedOwnedNotes: Note[] = ownedNotes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content || '',
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        featured_image: note.featured_image || undefined,
        user_id: note.user_id,
        pinned: note.pinned || false,
        note_type: (note.note_type as NoteType) || 'note',
        isOwnedByUser: true,
        isSharedWithUser: false,
        shares: sharesMap.get(note.id) || [],
      }));

      const formattedSharedNotes: Note[] = sharedNotesData.map(share => ({
        id: share.notes.id,
        title: share.notes.title,
        content: share.notes.content || '',
        createdAt: share.notes.created_at,
        updatedAt: share.notes.updated_at,
        featured_image: share.notes.featured_image || undefined,
        user_id: share.notes.user_id,
        pinned: false,
        note_type: ((share.notes as any).note_type as NoteType) || 'note',
        isOwnedByUser: false,
        isSharedWithUser: true,
        userPermission: share.permission as 'read' | 'write',
      }));

      const allNotes = [...formattedOwnedNotes, ...formattedSharedNotes].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setNotes(allNotes);
      
      // Save owned notes to offline storage for future offline access
      await offlineStorage.saveNotes(formattedOwnedNotes, user!.id);
    } catch (error) {
      console.error('Error loading notes:', error);
      // Try to load offline notes as fallback
      const offlineNotes = await offlineStorage.loadNotes(user!.id);
      setNotes(offlineNotes);
      
      if (offlineNotes.length > 0) {
        toast({
          title: "Working offline",
          description: "Showing cached notes. Changes will sync when online.",
        });
      }
    } finally {
      console.log('loadNotes: Finished, setting loading to false and hasInitialLoad to true');
      setLoading(false);
      setHasInitialLoad(true);
    }
  };
  
  const shouldRefreshPrompts = () => {
    const lastRefreshDate = localStorage.getItem('lastPromptsRefreshDate');
    if (!lastRefreshDate) return true;
    
    const lastRefresh = new Date(lastRefreshDate);
    const today = new Date();
    
    // Check if it's a new day
    return today.toDateString() !== lastRefresh.toDateString();
  };

  // Load daily prompts from localStorage on component mount
  useEffect(() => {
    const savedPrompts = localStorage.getItem('dailyPrompts');
    if (savedPrompts && !shouldRefreshPrompts()) {
      try {
        const parsed = JSON.parse(savedPrompts);
        if (Array.isArray(parsed) && parsed.length === 3) {
          setDailyPrompts(parsed);
          return;
        }
      } catch (error) {
        console.error('Error parsing saved prompts:', error);
      }
    }
    
    // If no valid saved prompts or it's a new day, generate new ones
    refreshDailyPrompts();
  }, []);
  
  // Check at midnight if we need to refresh prompts
  useEffect(() => {
    const checkDailyReset = () => {
      if (shouldRefreshPrompts()) {
        refreshDailyPrompts();
      }
    };
    
    // Check initially
    checkDailyReset();
    
    // Set interval to check every hour (we don't need to check every second)
    const interval = setInterval(checkDailyReset, 1000 * 60 * 60);
    
    return () => clearInterval(interval);
  }, []);
  
  // Save daily prompts to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dailyPrompts', JSON.stringify(dailyPrompts));
  }, [dailyPrompts]);

  function getRandomPrompts(count: number): WritingPrompt[] {
    const shuffled = [...writingPrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  const refreshDailyPrompts = () => {
    const newPrompts = getRandomPrompts(3);
    setDailyPrompts(newPrompts);
    localStorage.setItem('lastPromptsRefreshDate', new Date().toISOString());
  };

  const addNote = async (noteType: NoteType = 'note'): Promise<Note> => {
    if (!user) {
      throw new Error('User must be authenticated to add notes');
    }

    const isChecklist = noteType === 'checklist';
    const tempNote: Note = {
      id: crypto.randomUUID(),
      title: isChecklist ? 'Untitled Checklist' : 'Untitled Note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user_id: user.id,
      pinned: false,
      note_type: noteType,
      isOwnedByUser: true,
      isSharedWithUser: false,
    };

    // Optimistically add to local state
    setNotes(prevNotes => [tempNote, ...prevNotes]);

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: tempNote.title,
          content: tempNote.content,
          note_type: noteType,
        })
        .select()
        .single();

      if (error) {
        // Revert optimistic update on error
        setNotes(prevNotes => prevNotes.filter(note => note.id !== tempNote.id));
        throw error;
      }

      // Update with actual database data (keeping ownership info)
      const dbNote: Note = {
        id: data.id,
        title: tempNote.title,
        content: tempNote.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        user_id: data.user_id,
        pinned: data.pinned || false,
        note_type: (data.note_type as NoteType) || 'note',
        isOwnedByUser: true,
        isSharedWithUser: false,
      };

      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === tempNote.id ? dbNote : note
        )
      );

      // Save to offline storage
      await offlineStorage.saveNote(dbNote, user.id);

      return dbNote;
    } catch (error) {
      console.error('Error adding note:', error);
      
      // Save to offline storage if online sync fails
      try {
        await offlineStorage.saveNote(tempNote, user.id);
        toast({
          title: "Note saved offline",
          description: "Note saved locally. Will sync when connection is restored.",
        });
        return tempNote;
      } catch (offlineError) {
        toast({
          title: "Error creating note",
          description: "Failed to create note. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>, silent = true) => {
    if (!user) {
      console.error('User must be authenticated to update notes');
      return;
    }

    // Optimistically update local state
    const updatedNote = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id 
          ? { ...note, ...updatedNote }
          : note
      )
    );
    
    if (currentNote && currentNote.id === id) {
      setCurrentNote({ ...currentNote, ...updatedNote });
    }

    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) {
        updateData.title = updates.title;
      }
      
      if (updates.content !== undefined) {
        updateData.content = updates.content;
      }
      
      if (updates.featured_image !== undefined) {
        updateData.featured_image = updates.featured_image;
      }

      const { error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating note:', error);
      }
      
      // Always save to offline storage
      const noteToSave = notes.find(note => note.id === id);
      if (noteToSave) {
        await offlineStorage.saveNote({ ...noteToSave, ...updatedNote }, user.id);
      }
    } catch (error) {
      console.error('Error updating note:', error);
      
      // Save to offline storage if online update fails
      const noteToSave = notes.find(note => note.id === id);
      if (noteToSave) {
        await offlineStorage.saveNote({ ...noteToSave, ...updatedNote }, user.id);
      }
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) {
      console.error('User must be authenticated to delete notes');
      return;
    }

    const noteToDelete = notes.find(note => note.id === id);
    if (!noteToDelete) {
      console.error('Note not found');
      return;
    }

    // Check if user owns the note or if it's shared with them
    const isOwner = noteToDelete.user_id === user.id;
    const isSharedNote = noteToDelete.isSharedWithUser && !noteToDelete.isOwnedByUser;

    // Optimistically update local state
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    if (currentNote && currentNote.id === id) {
      setCurrentNote(null);
    }

    try {
      if (isSharedNote) {
        // If it's a shared note, remove the user's access using the database function
        console.log('Attempting to remove share access for note:', id, 'user:', user.id);
        
        const { data, error } = await supabase.rpc('remove_shared_note_access', {
          note_id_param: id
        });

        if (error) {
          console.error('Error removing note access:', error);
          // Revert optimistic update
          setNotes(prevNotes => [noteToDelete, ...prevNotes]);
          if (currentNote?.id === id) {
            setCurrentNote(noteToDelete);
          }
        } else if (data === false) {
          console.log('No share record found for this user and note');
          // Revert optimistic update  
          setNotes(prevNotes => [noteToDelete, ...prevNotes]);
          if (currentNote?.id === id) {
            setCurrentNote(noteToDelete);
          }
        } else {
          console.log('Successfully removed share access');
        }
      } else if (isOwner) {
        // Permanently delete owned notes
        const { data, error } = await supabase.rpc('permanently_delete_note', {
          note_id_param: id
        });

        if (error) {
          console.error('Error deleting note:', error);
          // Revert optimistic update
          setNotes(prevNotes => [noteToDelete, ...prevNotes]);
          if (currentNote?.id === id) {
            setCurrentNote(noteToDelete);
          }
        }
      } else {
        console.error('User does not have permission to delete this note');
        return;
      }
      
      // Always delete from offline storage
      await offlineStorage.deleteNote(id, user.id);
    } catch (error) {
      console.error('Error deleting note:', error);
      
      // Delete from offline storage even if online deletion fails
      await offlineStorage.deleteNote(id, user.id);
    }
  };

  const togglePinNote = async (id: string) => {
    if (!user) {
      console.error('User must be authenticated to pin notes');
      return;
    }

    const note = notes.find(n => n.id === id);
    if (!note || !note.isOwnedByUser) {
      console.error('Note not found or not owned by user');
      return;
    }

    const newPinnedState = !note.pinned;
    
    // Optimistically update local state
    setNotes(prevNotes => 
      prevNotes.map(n => 
        n.id === id ? { ...n, pinned: newPinnedState } : n
      )
    );

    try {
      const { error } = await supabase
        .from('notes')
        .update({ pinned: newPinnedState })
        .eq('id', id);

      if (error) {
        console.error('Error toggling pin:', error);
        // Revert optimistic update
        setNotes(prevNotes => 
          prevNotes.map(n => 
            n.id === id ? { ...n, pinned: !newPinnedState } : n
          )
        );
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      // Revert optimistic update
      setNotes(prevNotes => 
        prevNotes.map(n => 
          n.id === id ? { ...n, pinned: !newPinnedState } : n
        )
      );
    }
  };



  const getNote = (id: string) => {
    return notes.find(note => note.id === id);
  };

  const duplicateNote = async (id: string): Promise<Note | null> => {
    if (!user) {
      console.error('User must be authenticated to duplicate notes');
      return null;
    }

    const noteToDuplicate = notes.find(note => note.id === id);
    if (!noteToDuplicate) {
      console.error('Note not found');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: `${noteToDuplicate.title} (Copy)`,
          content: noteToDuplicate.content,
          note_type: noteToDuplicate.note_type || 'note',
        })
        .select()
        .single();

      if (error) throw error;

      const newNote: Note = {
        id: data.id,
        title: data.title,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        user_id: data.user_id,
        pinned: false,
        note_type: (data.note_type as NoteType) || 'note',
        isOwnedByUser: true,
        isSharedWithUser: false,
      };

      // If it's a checklist, duplicate the checklist items too
      if (noteToDuplicate.note_type === 'checklist') {
        const { data: checklistItems } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('note_id', id)
          .order('position', { ascending: true });

        if (checklistItems && checklistItems.length > 0) {
          const newItems = checklistItems.map((item, index) => ({
            note_id: newNote.id,
            content: item.content,
            completed: false,
            position: index,
          }));

          await supabase.from('checklist_items').insert(newItems);
        }
      }

      setNotes(prevNotes => [newNote, ...prevNotes]);
      await offlineStorage.saveNote(newNote, user.id);

      return newNote;
    } catch (error) {
      console.error('Error duplicating note:', error);
      toast({
        title: "Error duplicating note",
        description: "Failed to duplicate note. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const syncNotes = async () => {
    await loadNotes();
    // Also sync preferences to ensure theme/color is up to date across devices
    window.dispatchEvent(new CustomEvent('refresh-preferences'));
    toast({
      title: "Notes synced",
      description: "Your notes and preferences have been refreshed from the server.",
    });
  };

  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * writingPrompts.length);
    return writingPrompts[randomIndex];
  };

  return (
    <NoteContext.Provider 
      value={{ 
        notes, 
        currentNote, 
        writingPrompts,
        dailyPrompts,
        loading,
        hasInitialLoad,
        addNote, 
        updateNote, 
        deleteNote,
        duplicateNote,
        togglePinNote,
        getNote,
        setCurrentNote,
        getRandomPrompt,
        refreshDailyPrompts,
        syncNotes
      }}
    >
      {children}
    </NoteContext.Provider>
  );
};

export const useNotes = (): NoteContextType => {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
};
