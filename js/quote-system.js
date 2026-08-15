/**
 * Obsidian Philosophical Quote of the Day & Wisdom Engine
 */
class QuoteSystem {
  constructor() {
    this.quotes = [
      {
        text: "We suffer more often in imagination than in reality.",
        author: "Seneca",
        category: "Stoicism",
        era: "Ancient Rome"
      },
      {
        text: "The impediment to action advances action. What stands in the way becomes the way.",
        author: "Marcus Aurelius",
        category: "Stoicism",
        era: "Meditations"
      },
      {
        text: "We can only see a short distance ahead, but we can see plenty there that needs to be done.",
        author: "Alan Turing",
        category: "Computation",
        era: "1950"
      },
      {
        text: "The first principle is that you must not fool yourself and you are the easiest person to fool.",
        author: "Richard Feynman",
        category: "Physics & Truth",
        era: "1974"
      },
      {
        text: "Simplicity is prerequisite for reliability.",
        author: "Edsger W. Dijkstra",
        category: "Computer Science",
        era: "EWD498"
      },
      {
        text: "That brain of mine is something more than merely mortal; as time will show.",
        author: "Ada Lovelace",
        category: "Pioneer",
        era: "1843"
      },
      {
        text: "No man is free who is not master of himself.",
        author: "Epictetus",
        category: "Stoicism",
        era: "Discourses"
      },
      {
        text: "It is not that we have a short time to live, but that we waste a lot of it.",
        author: "Seneca",
        category: "Time & Focus",
        era: "On the Shortness of Life"
      },
      {
        text: "Focusing is about saying no. You've got to say no, no, no and when you say no, you piss off people.",
        author: "Steve Jobs",
        category: "Productivity",
        era: "1997"
      },
      {
        text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
        author: "Martin Fowler",
        category: "Engineering",
        era: "Refactoring"
      },
      {
        text: "He who has a why to live can bear almost any how.",
        author: "Friedrich Nietzsche",
        category: "Philosophy",
        era: "1889"
      },
      {
        text: "The secret of getting ahead is getting started.",
        author: "Mark Twain",
        category: "Momentum",
        era: "Essays"
      },
      {
        text: "Nature does not hurry, yet everything is accomplished.",
        author: "Lao Tzu",
        category: "Taoism",
        era: "Tao Te Ching"
      },
      {
        text: "Premature optimization is the root of all evil in programming.",
        author: "Donald Knuth",
        category: "Computer Science",
        era: "1974"
      },
      {
        text: "You do not rise to the level of your goals. You fall to the level of your systems.",
        author: "James Clear",
        category: "Habits",
        era: "Atomic Habits"
      },
      {
        text: "In the depths of winter, I finally learned that within me there lay an invincible summer.",
        author: "Albert Camus",
        category: "Resilience",
        era: "1954"
      },
      {
        text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
        author: "Ralph Waldo Emerson",
        category: "Individuality",
        era: "Essays"
      },
      {
        text: "Programs must be written for people to read, and only incidentally for machines to execute.",
        author: "Harold Abelson",
        category: "SICP",
        era: "1985"
      },
      {
        text: "Silence is the sleep that nourishes wisdom.",
        author: "Francis Bacon",
        category: "Contemplation",
        era: "Novum Organum"
      },
      {
        text: "Look deep into nature, and then you will understand everything better.",
        author: "Albert Einstein",
        category: "Science",
        era: "Letters"
      }
    ];

    this.currentQuote = null;
    this.favorites = [];
    this.init();
  }

  async init() {
    this.currentQuote = this.getDailyQuote();
    this.bindEvents();
    this.renderCurrentQuote();
  }

  getDailyQuote() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const index = dayOfYear % this.quotes.length;
    return this.quotes[index];
  }

  getRandomQuote() {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.quotes.length);
    } while (this.quotes[newIndex] === this.currentQuote && this.quotes.length > 1);
    
    this.currentQuote = this.quotes[newIndex];
    return this.currentQuote;
  }

  bindEvents() {
    $(document).on('click', '#quote-next-btn', () => {
      this.getRandomQuote();
      this.renderCurrentQuote(true);
      if (window.audioSynth) window.audioSynth.playClick();
    });

    $(document).on('click', '#quote-copy-btn', () => {
      if (!this.currentQuote) return;
      const text = `"${this.currentQuote.text}" — ${this.currentQuote.author}`;
      navigator.clipboard.writeText(text);
      
      const $btn = $('#quote-copy-btn');
      const orig = $btn.html();
      $btn.html('<span>✓ COPIED TO CLIPBOARD</span>');
      setTimeout(() => $btn.html(orig), 2000);
      if (window.audioSynth) window.audioSynth.playKeyTick();
    });

    $(document).on('click', '#quote-fav-btn', async () => {
      if (!this.currentQuote) return;
      const q = this.currentQuote;
      if (window.productivityDB) {
        await window.productivityDB.put('favorite_quotes', {
          id: 'q_' + Date.now(),
          text: q.text,
          author: q.author,
          category: q.category,
          dateSaved: new Date().toLocaleDateString()
        });
      }
      const $btn = $('#quote-fav-btn');
      $btn.addClass('active').html('<span>★ SAVED IN ARCHIVES</span>');
      setTimeout(() => $btn.removeClass('active').html('<span>☆ SAVE TO FAVORITES</span>'), 2500);
      if (window.audioSynth) window.audioSynth.playTaskComplete();
    });
  }

  renderCurrentQuote(animate = false) {
    const q = this.currentQuote || this.getDailyQuote();
    const $container = $('#quote-display-card');
    if (!$container.length) return;

    if (animate) {
      $container.addClass('quote-fade-out');
      setTimeout(() => {
        $('#quote-text').text(`“${q.text}”`);
        $('#quote-author').text(`— ${q.author}`);
        $('#quote-category').text(`${q.category} // ${q.era}`);
        $container.removeClass('quote-fade-out').addClass('quote-fade-in');
        setTimeout(() => $container.removeClass('quote-fade-in'), 400);
      }, 200);
    } else {
      $('#quote-text').text(`“${q.text}”`);
      $('#quote-author').text(`— ${q.author}`);
      $('#quote-category').text(`${q.category} // ${q.era}`);
    }
  }
}

window.quoteSystem = new QuoteSystem();
