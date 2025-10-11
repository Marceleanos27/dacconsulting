// rag-system.js
// RAG (Retrieval-Augmented Generation) systém pre AI chatbot

class RAGSystem {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.stopWords = new Set([
      'a', 'je', 'to', 'na', 'v', 'sa', 'so', 'pre', 'ako', 'že', 'ma', 'mi', 'me', 'si', 'su', 'som',
      'ale', 'ani', 'az', 'ak', 'bo', 'by', 'co', 'ci', 'do', 'ho', 'im', 'ju', 'ka', 'ku', 'ly',
      'ne', 'ni', 'no', 'od', 'po', 'pri', 'ro', 'ta', 'te', 'ti', 'tu', 'ty', 'uz', 'vo', 'za'
    ]);
    
    // Synonymá pre lepšie vyhľadávanie
    this.synonyms = {
      'clo': ['colny', 'colne', 'colnictvo', 'dovozne', 'vyvozne', 'customs', 'duty'],
      'dan': ['dane', 'danovy', 'spotrebna', 'excise', 'odvod', 'zdanenie'],
      'cbam': ['uhlikov', 'carbon', 'emisie', 'uhlikova', 'hranicny', 'mechanizmus'],
      'poradenstvo': ['konzultacia', 'konzultacie', 'poradca', 'poradenstvi', 'consulting', 'advisory'],
      'audit': ['kontrola', 'overenie', 'revize', 'prehliadka', 'inspekcia'],
      'zastupovanie': ['zastupca', 'representation', 'zahranicny', 'zahranicie', 'zastupenie'],
      'dovoz': ['import', 'dovozca', 'dovezie', 'dovazat', 'dovozu'],
      'vyvoz': ['export', 'vyvozca', 'vyvezie', 'vyvazat', 'vyvozu'],
      'tarif': ['sadzba', 'tarifny', 'sadzobnik', 'klasifikacia', 'kod'],
      'origin': ['povod', 'povodove', 'origin', 'eur1', 'preukaz'],
      'skolenie': ['kurz', 'vzdelavanie', 'training', 'seminar', 'workshop'],
      'legislativa': ['zakon', 'predpisy', 'legislativny', 'normy', 'pravidla'],
      'kontakt': ['spojenie', 'informacie', 'udaje', 'email', 'telefon', 'adresa'],
      'cena': ['cenny', 'ceny', 'kolko', 'stoji', 'price', 'cenova', 'ponuka']
    };
  }

  // Hlavná metóda pre vyhľadávanie relevantného obsahu
  searchRelevantContent(query, maxResults = 3) {
    const normalizedQuery = this.normalizeText(query);
    const queryWords = this.extractKeywords(normalizedQuery);
    const bigrams = this.extractBigrams(normalizedQuery);
    const expandedWords = this.expandWithSynonyms(queryWords);
    
    if (queryWords.length === 0 && bigrams.length === 0) {
      return [];
    }

    const results = this.knowledgeBase.map(item => {
      const score = this.calculateRelevanceScore(item, expandedWords, normalizedQuery, bigrams);
      return { ...item, relevanceScore: score };
    })
    .filter(item => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

    console.log('RAG Search Results:', results.map(r => ({ title: r.title, score: r.relevanceScore })));
    return results;
  }

  // Výpočet skóre relevancie (vylepšený)
  calculateRelevanceScore(item, queryWords, fullQuery, bigrams = []) {
    let score = 0;
    const normalizedTitle = this.normalizeText(item.title);
    const normalizedContent = this.normalizeText(item.content);
    const normalizedKeywords = item.keywords.map(k => this.normalizeText(k));
    
    // 1. Scoring pre jednotlivé slová
    queryWords.forEach(word => {
      // Kľúčové slová (najvyššia priorita)
      const keywordMatch = normalizedKeywords.some(keyword => 
        keyword.includes(word) || word.includes(keyword) || this.isSimilar(word, keyword)
      );
      if (keywordMatch) {
        score += 6; // Zvýšené z 5 na 6
      }
      
      // Názov
      if (normalizedTitle.includes(word)) {
        score += 4;
      }
      
      // Obsah (s TF-IDF boost pre zriedkavé slová)
      if (normalizedContent.includes(word)) {
        const frequency = (normalizedContent.match(new RegExp(word, 'g')) || []).length;
        score += Math.min(frequency * 1.5, 4); // Max 4 body za slovo
      }
    });

    // 2. Scoring pre bigramy (2-slovné frázy)
    bigrams.forEach(bigram => {
      if (normalizedContent.includes(bigram) || normalizedTitle.includes(bigram)) {
        score += 5; // Vysoké skóre pre presné frázy
      }
      normalizedKeywords.forEach(keyword => {
        if (keyword.includes(bigram)) {
          score += 6;
        }
      });
    });

    // 3. Bonus za presný match celej frázy
    if (normalizedContent.includes(fullQuery) || normalizedTitle.includes(fullQuery)) {
      score += 8; // Zvýšené z 3 na 8
    }

    // 4. Bonus za čísla (ceny školení, telefónne čísla, dátumy)
    const numbers = fullQuery.match(/\d+/g);
    if (numbers) {
      numbers.forEach(num => {
        if (normalizedContent.includes(num)) {
          score += 3;
        }
      });
    }

    return score;
  }

  // Extrakcia kľúčových slov z dotazu
  extractKeywords(normalizedText) {
    return normalizedText
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word))
      .slice(0, 12);
  }

  // Extrakcia bigramov (2-slovné frázy)
  extractBigrams(normalizedText) {
    const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
    const bigrams = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      // Preskočiť bigramy so stop words
      if (!this.stopWords.has(words[i]) || !this.stopWords.has(words[i + 1])) {
        bigrams.push(bigram);
      }
    }
    
    return bigrams;
  }

  // Rozšírenie slov o synonymá
  expandWithSynonyms(words) {
    const expanded = new Set(words);
    
    words.forEach(word => {
      // Nájdi synonymá pre toto slovo
      for (const [key, synonymList] of Object.entries(this.synonyms)) {
        if (key === word || synonymList.includes(word)) {
          // Pridaj kľúčové slovo
          expanded.add(key);
          // Pridaj všetky synonymá
          synonymList.forEach(syn => expanded.add(syn));
        }
      }
    });
    
    return Array.from(expanded);
  }

  // Kontrola podobnosti slov (fuzzy matching pre preklepy)
  isSimilar(word1, word2) {
    if (word1 === word2) return true;
    if (Math.abs(word1.length - word2.length) > 2) return false;
    if (word1.includes(word2) || word2.includes(word1)) return true;
    
    // Tolerancia max 1 preklep
    let changes = 0;
    const maxLen = Math.max(word1.length, word2.length);
    for (let i = 0; i < maxLen; i++) {
      if (word1[i] !== word2[i]) changes++;
      if (changes > 1) return false;
    }
    return changes <= 1;
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



  // Vytvorenie kontextu pre AI model
  buildContext(relevantContent) {
    if (relevantContent.length === 0) {
      return '';
    }
    
    const context = relevantContent
      .map((item, index) => `**${index + 1}. ${item.title}**:\n${item.content}`)
      .join('\n\n');
    
    // Kontrola či obsahuje konzultačné kľúčové slová
    const isConsultationRelated = relevantContent.some(item => 
      item.keywords.some(kw => ['konzultácia', 'stretnutie', 'poradenstvo'].includes(kw.toLowerCase()))
    );
    
    const consultationNote = isConsultationRelated 
      ? ' Pri ponuke konzultácie odporuč kontaktovanie na telefón alebo email uvedený v kontexte.'
      : '';
    
    return `PRESNÉ INFORMÁCIE O DAC CONSULTING 2.0 (používaj LEN tieto fakty):\n\n${context}\n\nINŠTRUKCIE: Odpovedaj presne podľa týchto informácií. NEPRÍDÁVAJ žiadne vlastné detaily.${consultationNote} Ceny školení uvedené v kontexte môžeš používať. Pre ceny iných služieb odporuč kontaktovanie firmy.`;
  }

  // Vyhľadávanie podľa ID
  getById(id) {
    return this.knowledgeBase.find(item => item.id === id);
  }
}

// Export pre použitie v iných súboroch
if (typeof window !== 'undefined') {
  window.RAGSystem = RAGSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RAGSystem;
}

