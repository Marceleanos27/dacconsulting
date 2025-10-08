// rag-system.js
// RAG (Retrieval-Augmented Generation) systém pre AI chatbot

class RAGSystem {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.stopWords = new Set([
      'a', 'aby', 'aj', 'ak', 'ako', 'ale', 'alebo', 'ani', 'az', 'bo', 'bu', 'by', 'byt', 'ci',
      'co', 'do', 'ho', 'i', 'ide', 'im', 'ist', 'ja', 'je', 'jeho', 'jej', 'ich', 'ju', 'k', 'kam',
      'kde', 'kto', 'ku', 'lebo', 'len', 'ma', 'mat', 'me', 'mi', 'mna', 'mne', 'mnou', 'my', 'na',
      'nas', 'nam', 'ne', 'nech', 'ni', 'no', 'o', 'od', 'ono', 'po', 'pod', 'pre', 'pred', 'pri',
      'ro', 's', 'sa', 'si', 'so', 'som', 'su', 'ta', 'tak', 'takze', 'tato', 'te', 'teba', 'tebe',
      'tebou', 'tento', 'ti', 'to', 'toto', 'tu', 'ty', 'tym', 'uz', 'v', 'vam', 'vas', 'vasa', 'vo',
      'vsetko', 'za', 'ze'
    ]);
  }

  // Hlavná metóda pre vyhľadávanie relevantného obsahu
  searchRelevantContent(query, maxResults = 3) {
    const normalizedQuery = this.normalizeText(query);
    const queryWords = this.extractKeywords(normalizedQuery);
    
    if (queryWords.length === 0) {
      // Ak nie sú žiadne kľúčové slová, vráť základné informácie o firme
      const fallback = this.knowledgeBase.filter(item => 
        item.category === 'company' || item.category === 'contact'
      ).slice(0, 2);
      return fallback;
    }

    const results = this.knowledgeBase.map(item => {
      const score = this.calculateRelevanceScore(item, queryWords, normalizedQuery);
      return { ...item, relevanceScore: score };
    })
    .filter(item => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

    console.log('RAG Search Results:', results.map(r => ({ 
      id: r.id,
      title: r.title, 
      category: r.category,
      score: r.relevanceScore 
    })));
    
    return results;
  }

  // Výpočet skóre relevancie
  calculateRelevanceScore(item, queryWords, fullQuery) {
    let score = 0;
    const normalizedTitle = this.normalizeText(item.title);
    const normalizedContent = this.normalizeText(item.content);
    
    queryWords.forEach(word => {
      // Skóre pre kľúčové slová (najvyššia priorita)
      if (item.keywords.some(keyword => 
        this.normalizeText(keyword).includes(word) || word.includes(this.normalizeText(keyword))
      )) {
        score += 8; // Zvýšené skóre pre keywords
      }
      
      // Skóre pre výskyt v názve
      if (normalizedTitle.includes(word)) {
        score += 6; // Zvýšené skóre pre title
      }
      
      // Skóre pre výskyt v obsahu
      if (normalizedContent.includes(word)) {
        score += 3; // Mierne zvýšené skóre pre content
      }
      
      // Bonus za presný match celej frázy
      if (normalizedContent.includes(fullQuery) || normalizedTitle.includes(fullQuery)) {
        score += 5; // Zvýšený bonus za presný match
      }
    });

    // Bonus za kategóriu matching
    if (this.getCategoryFromQuery(fullQuery) === item.category) {
      score += 4; // Zvýšený bonus za kategóriu
    }

    // Bonus pre často používané kategórie
    const priorityCategories = ['services', 'cbam', 'contact', 'training', 'company'];
    if (priorityCategories.includes(item.category)) {
      score += 1;
    }

    return score;
  }

  // Extrakcia kľúčových slov z dotazu
  extractKeywords(normalizedText) {
    // Prioritné kľúčové slová pre DAC Consulting
    const priorityKeywords = [
      'cbam', 'clo', 'colne', 'spotrebne', 'dane', 'skolenie', 'kurz',
      'poradenstvo', 'zastupovanie', 'audit', 'kontrola', 'deklarant',
      'aeo', 'incoterms', 'intrastat', 'emcs', 'alkohol', 'tabak',
      'mineralny', 'olej', 'elektrina', 'plyn', 'uhlie', 'dovoz', 'vyvoz'
    ];
    
    const words = normalizedText
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !this.stopWords.has(word) &&
        !/^\d+$/.test(word)
      );
    
    // Rozdeliť na prioritné a ostatné slová
    const priority = words.filter(word => priorityKeywords.includes(word));
    const others = words.filter(word => !priorityKeywords.includes(word));
    
    // Prioritné slová idú ako prvé
    return [...priority, ...others].slice(0, 12); // Zvýšený limit na 12 slov
  }

  // Normalizácia textu
  normalizeText(text) {
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Odstránenie diakritiky
      .replace(/[^\w\sáäčďéíĺľňóôŕšťúýž]/g, ' ') // Zachovanie slovenských znakov
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Detekcia kategórie z dotazu
  getCategoryFromQuery(query) {
    const categoryKeywords = {
      'company': ['spolocnost', 'firma', 'nas', 'historia', 'zalozena', 'preco', 'vyhody', 'experti'],
      'contact': ['kontakt', 'adresa', 'telefon', 'email', 'kde', 'lokacia', 'nachadza', 'sidli', 'bratislava', 'ruzinov'],
      'cbam': ['cbam', 'uhlikov', 'mechanizmus', 'kompenzacia', 'emisie', 'cement', 'hlinik', 'hnojiva', 'elektrina', 'ocel'],
      'services': ['sluzby', 'ponukate', 'nabizite', 'co', 'robite', 'colne', 'poradenstvo', 'zastupovanie', 'audit', 'pomoc'],
      'training': ['skolenie', 'kurz', 'vzdelavanie', 'seminar', 'trening', 'workshop', 'konzultacny'],
      'payment': ['platba', 'cena', 'kolko', 'stoji', 'faktura', 'uhrada', 'bankovy', 'ucet', 'iban'],
      'administrative': ['podmienky', 'storno', 'uzavierka', 'prihlaska', 'nahradnik', 'zlavy'],
      'legal': ['gdpr', 'ochrana', 'udaje', 'osobne', 'sukromie'],
      'news': ['aktuality', 'novinky', 'trump', 'cla', 'zmeny', 'legislativa']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return category;
      }
    }
    return null;
  }

  // Vytvorenie kontextu pre AI model
  buildContext(relevantContent) {
    if (relevantContent.length === 0) {
      return `PRESNÉ INFORMÁCIE O DAC CONSULTING 2.0: Spoločnosť založená v roku 2007, špecializujúca sa na colné poradenstvo, spotrebné dane a CBAM. Kontakt: info@dacconsulting.sk, +421 907 760 347.`;
    }
    
    const context = relevantContent
      .map((item, index) => `[${index + 1}] **${item.title}:**\n${item.content}`)
      .join('\n\n---\n\n');
    
    return `RELEVANTNÉ INFORMÁCIE O DAC CONSULTING 2.0 (používaj výhradne tieto fakty):\n\n${context}\n\n---\n\nINŠTRUKCIE PRE ODPOVEĎ:\n• Odpovedaj PRESNE podľa vyššie uvedených informácií\n• NEPRÍDÁVAJ vlastné fakty, detaily alebo odhady\n• Ak informácia nie je v kontexte, povedz: "Na túto otázku nemám presné informácie, kontaktujte nás prosím"\n• Uvádzaj konkrétne údaje (ceny, telefóny, adresy) len ak sú explicitne uvedené vyššie`;
  }

  // Získanie kontextu pre špecifickú kategóriu
  getContextByCategory(category) {
    const categoryItems = this.knowledgeBase.filter(item => item.category === category);
    return this.buildContext(categoryItems);
  }

  // Vyhľadávanie podľa ID
  getById(id) {
    return this.knowledgeBase.find(item => item.id === id);
  }

  // Získanie všetkých kategórií
  getCategories() {
    return [...new Set(this.knowledgeBase.map(item => item.category))];
  }

  // Debug metóda pre testovanie
  debugSearch(query) {
    console.log('=== RAG DEBUG ===');
    console.log('Query:', query);
    console.log('Normalized:', this.normalizeText(query));
    console.log('Keywords:', this.extractKeywords(this.normalizeText(query)));
    console.log('Category:', this.getCategoryFromQuery(this.normalizeText(query)));
    
    const results = this.searchRelevantContent(query, 5);
    console.log('Results:', results);
    console.log('Context:', this.buildContext(results.slice(0, 2)));
    console.log('=================');
    
    return results;
  }
}

// Export pre použitie v iných súboroch
if (typeof window !== 'undefined') {
  window.RAGSystem = RAGSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RAGSystem;
}