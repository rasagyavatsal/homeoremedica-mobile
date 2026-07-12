/**
 * Comprehensive synonym mapping for homeopathy symptom search
 * Maps common/modern terms to classical homeopathic terminology
 * 
 * Structure: Generated from canonical groups
 */

const canonicalGroups: string[][] = [
  ['runny nose', 'coryza', 'nasal discharge', 'rhinorrhea', 'fluent coryza', 'watery discharge nose', 'cold', 'rhinitis', 'fluent', 'common cold', 'catarrh', 'upper respiratory infection'],
  ['stuffy nose', 'nasal obstruction', 'blocked nose', 'nasal congestion', 'stoppage nose', 'obstructed nose', 'stoppage'],
  ['sneezing', 'sternutation', 'sneezes', 'paroxysmal sneezing'],
  ['nosebleed', 'epistaxis', 'bleeding nose', 'hemorrhage nose', 'nasal hemorrhage'],
  ['loss of smell', 'anosmia', 'smell lost', 'cannot smell'],
  ['sinusitis', 'sinus inflammation', 'sinus pain', 'frontal sinus', 'maxillary sinus'],
  ['post nasal drip', 'mucus throat', 'hawking', 'posterior nares'],
  ['sore throat', 'pharyngitis', 'throat pain', 'painful throat', 'raw throat', 'throat inflammation'],
  ['tonsillitis', 'tonsils swollen', 'inflamed tonsils', 'quinsy', 'throat swelling', 'peritonsillar abscess', 'throat abscess'],
  ['hoarseness', 'hoarse voice', 'voice loss', 'laryngitis', 'rough voice', 'aphonia', 'cannot speak', 'lost voice', 'larynx inflammation', 'speechless'],
  ['difficulty swallowing', 'dysphagia', 'swallowing difficult', 'painful swallowing', 'cannot swallow'],
  ['lump in throat', 'globus', 'globus hystericus', 'throat constriction', 'ball throat'],
  ['cough', 'tussis', 'coughing', 'hacking', 'barking cough', 'croup', 'croupy cough', 'laryngismus'],
  ['dry cough', 'tickling cough', 'hacking cough', 'unproductive cough', 'irritating cough'],
  ['wet cough', 'productive cough', 'loose cough', 'rattling cough', 'mucus cough'],
  ['whooping cough', 'pertussis', 'spasmodic cough', 'paroxysmal cough'],
  ['shortness of breath', 'dyspnea', 'dyspnoea', 'breathlessness', 'difficult breathing', 'air hunger', 'cannot breathe'],
  ['wheezing', 'whistling breath', 'sibilant', 'asthmatic breathing', 'asthma', 'asthmatic', 'bronchial asthma', 'spasmodic breathing'],
  ['bronchitis', 'bronchial inflammation', 'chest cold', 'bronchial catarrh'],
  ['pneumonia', 'lung inflammation', 'pulmonary inflammation', 'chest infection'],
  ['pleurisy', 'pleuritis', 'pleural pain', 'stitching chest pain'],
  ['chest tightness', 'constriction chest', 'oppression chest', 'chest pressure'],
  ['chest pain', 'thoracic pain', 'pectoral pain', 'stitching chest', 'angina', 'chest pain heart', 'cardiac pain', 'heart pain'],
  ['headache', 'cephalalgia', 'head pain', 'cephalgia', 'pain head'],
  ['migraine', 'hemicrania', 'sick headache', 'one-sided headache', 'hemicranial'],
  ['tension headache', 'band-like headache', 'pressure headache', 'constricting headache'],
  ['throbbing headache', 'pulsating headache', 'beating headache', 'hammering head'],
  ['vertigo', 'dizziness', 'giddiness', 'spinning sensation', 'lightheaded', 'swimming head'],
  ['fainting', 'syncope', 'faintness', 'swooning', 'loss of consciousness'],
  ['numbness', 'anesthesia', 'loss of sensation', 'tingling', 'paresthesia', 'deadness', 'pins and needles', 'formication', 'prickling', 'crawling', 'creeping', 'ants crawling', 'insects crawling'],
  ['paralysis', 'palsy', 'paralytic', 'loss of movement', 'hemiplegia'],
  ['trembling', 'tremor', 'shaking', 'quivering', 'tremulous'],
  ['seizure', 'convulsion', 'fit', 'epilepsy', 'spasm', 'epileptic', 'epileptic fit', 'fits', 'muscle cramps', 'cramp', 'muscle cramp', 'spasmodic', 'charley horse', 'muscle spasm', 'cramping', 'griping', 'colic', 'twisting', 'stomach cramps', 'abdominal colic', 'griping pain', 'cramping pain', 'intestinal colic', 'gastric spasm', 'abdominal cramps'],
  ['stroke', 'apoplexy', 'cerebral hemorrhage', 'paralysis sudden'],
  ['eye pain', 'ophthalmalgia', 'pain eyes', 'ocular pain', 'eyeball pain'],
  ['red eyes', 'conjunctivitis', 'bloodshot eyes', 'eye inflammation', 'inflamed eyes', 'pink eye'],
  ['watery eyes', 'lachrymation', 'lacrimation', 'tearing', 'epiphora', 'eyes water', 'tearing pain', 'rending', 'pulling', 'drawing', 'drawing pain', 'tension', 'tightness', 'constriction', 'tight', 'constricting', 'band-like'],
  ['dry eyes', 'xerophthalmia', 'eyes dry', 'lack of tears'],
  ['blurred vision', 'dim vision', 'foggy vision', 'vision blurred', 'amblyopia'],
  ['double vision', 'diplopia', 'seeing double'],
  ['sensitivity to light', 'photophobia', 'light sensitive', 'cannot bear light'],
  ['eye discharge', 'eye mucus', 'matter eyes', 'purulent eyes', 'sticky eyes'],
  ['stye', 'hordeolum', 'eyelid swelling', 'eyelid inflammation', 'swollen eyelids', 'edema eyelids', 'puffy eyes'],
  ['itchy eyes', 'eyes itch', 'eye itching', 'pruritus eyes'],
  ['dark circles', 'periorbital darkening', 'circles under eyes'],
  ['floaters', 'muscae volitantes', 'spots vision', 'floating spots'],
  ['earache', 'otalgia', 'ear pain', 'pain ear'],
  ['ear infection', 'otitis', 'otitis media', 'middle ear infection', 'ear inflammation'],
  ['ringing in ears', 'tinnitus', 'buzzing ears', 'noises ear', 'ear ringing'],
  ['hearing loss', 'deafness', 'hard of hearing', 'diminished hearing', 'deaf', 'cannot hear'],
  ['ear discharge', 'otorrhea', 'ear drainage', 'running ear'],
  ['itchy ears', 'ears itch', 'ear itching', 'pruritus ear'],
  ['blocked ears', 'ear fullness', 'plugged ears', 'ear obstruction'],
  ['nausea', 'queasiness', 'sick feeling', 'stomach upset', 'want to vomit'],
  ['vomiting', 'emesis', 'throwing up', 'puking', 'regurgitation'],
  ['heartburn', 'pyrosis', 'acid reflux', 'burning stomach', 'waterbrash', 'gerd', 'regurgitation acid'],
  ['indigestion', 'dyspepsia', 'upset stomach', 'stomach discomfort', 'digestive upset'],
  ['bloating', 'distension', 'abdominal distension', 'fullness', 'tympanites', 'flatulent distension', 'full', 'bloated feeling'],
  ['gas', 'flatulence', 'flatus', 'wind', 'borborygmi', 'passing gas'],
  ['belching', 'eructation', 'burping', 'eructations'],
  ['hiccup', 'hiccough', 'singultus', 'hiccups'],
  ['stomach pain', 'gastralgia', 'epigastric pain', 'gastric pain', 'abdominal pain'],
  ['loss of appetite', 'anorexia', 'no appetite', 'appetite lost', 'aversion food'],
  ['excessive appetite', 'polyphagia', 'increased appetite', 'ravenous', 'bulimia', 'hunger', 'hungry', 'appetite'],
  ['excessive thirst', 'polydipsia', 'thirsty', 'increased thirst', 'thirst', 'desire water'],
  ['no thirst', 'thirstless', 'absence thirst'],
  ['diarrhea', 'diarrhoea', 'loose stool', 'loose bowels', 'watery stool', 'frequent stool'],
  ['constipation', 'costiveness', 'hard stool', 'difficult stool', 'infrequent stool', 'obstinate constipation'],
  ['bloody stool', 'melena', 'blood in stool', 'hemorrhage bowels', 'rectal bleeding', 'black stool', 'tarry stool'],
  ['mucus in stool', 'mucous stool', 'slimy stool', 'jelly-like stool'],
  ['hemorrhoids', 'piles', 'rectal varices', 'bleeding piles'],
  ['rectal pain', 'proctalgia', 'anus pain', 'anal pain'],
  ['itchy anus', 'pruritus ani', 'anal itching', 'rectal itching'],
  ['worms', 'intestinal worms', 'parasites', 'helminthiasis', 'pinworms', 'threadworms'],
  ['irritable bowel', 'ibs', 'spastic colon', 'alternating stool'],
  ['jaundice', 'icterus', 'yellow skin', 'yellowing', 'hepatic'],
  ['gallstone', 'cholelithiasis', 'biliary colic', 'gallbladder stone'],
  ['liver pain', 'hepatic pain', 'right hypochondrium pain', 'hepatalgia'],
  ['frequent urination', 'polyuria', 'urinary frequency', 'frequent micturition', 'excessive urination'],
  ['painful urination', 'dysuria', 'burning urination', 'urination painful'],
  ['blood in urine', 'hematuria', 'bloody urine', 'hemorrhage urinary'],
  ['inability to urinate', 'urinary retention', 'retention urine', 'cannot urinate', 'suppression urine'],
  ['incontinence', 'involuntary urination', 'urine leakage', 'enuresis', 'bed wetting', 'nocturnal enuresis', 'incontinence night'],
  ['kidney pain', 'renal colic', 'nephralgia', 'loin pain', 'flank pain', 'renal pain'],
  ['kidney stone', 'renal calculus', 'nephrolithiasis', 'urinary stone'],
  ['urinary tract infection', 'uti', 'cystitis', 'bladder infection', 'urethritis', 'bladder inflammation'],
  ['cloudy urine', 'turbid urine', 'milky urine'],
  ['dark urine', 'concentrated urine', 'scanty urine', 'high colored urine'],
  ['menstrual pain', 'dysmenorrhea', 'period pain', 'cramps menstrual', 'painful menses'],
  ['heavy periods', 'menorrhagia', 'excessive bleeding', 'profuse menses', 'flooding', 'excessive menstrual bleeding'],
  ['irregular periods', 'metrorrhagia', 'irregular menses', 'erratic periods', 'intermenstrual bleeding'],
  ['absent periods', 'amenorrhea', 'no periods', 'suppressed menses', 'menses absent'],
  ['pms', 'premenstrual syndrome', 'before menses', 'premenstrual'],
  ['hot flashes', 'hot flushes', 'climacteric', 'menopausal flush', 'menopause', 'change of life', 'cessation menses'],
  ['vaginal discharge', 'leucorrhea', 'leucorrhoea', 'whites', 'vaginal secretion'],
  ['vaginal itching', 'pruritus vulvae', 'vulvar itching', 'genital itching'],
  ['prolapse', 'uterine prolapse', 'bearing down', 'falling womb'],
  ['breast pain', 'mastalgia', 'mastodynia', 'painful breasts', 'sore breasts'],
  ['breast lumps', 'breast nodules', 'mammary lumps', 'breast swelling'],
  ['infertility', 'sterility', 'barrenness', 'cannot conceive'],
  ['erectile dysfunction', 'impotence', 'impotency', 'weak erection'],
  ['premature ejaculation', 'early ejaculation', 'quick ejaculation'],
  ['prostate problems', 'prostatitis', 'enlarged prostate', 'prostatic', 'prostate inflammation'],
  ['testicular pain', 'orchialgia', 'testicle pain', 'pain testes'],
  ['rash', 'eruption', 'skin eruption', 'exanthema', 'cutaneous eruption'],
  ['itching', 'pruritus', 'itchy', 'itch'],
  ['hives', 'urticaria', 'nettle rash', 'wheals'],
  ['eczema', 'dermatitis', 'atopic dermatitis', 'skin inflammation'],
  ['psoriasis', 'scaly skin', 'psoriatic', 'silvery scales', 'dry skin', 'xerosis', 'rough skin'],
  ['acne', 'pimples', 'acne vulgaris', 'pustules face', 'pustules', 'papules'],
  ['boils', 'furuncle', 'abscess', 'carbuncle', 'boil', 'suppuration', 'pus collection', 'multiple boils', 'infection', 'pus formation', 'festering', 'sepsis', 'infected', 'blood poisoning', 'septic'],
  ['warts', 'verruca', 'papilloma', 'condyloma', 'wart'],
  ['moles', 'nevus', 'naevus', 'pigmented spots', 'mole'],
  ['oily skin', 'seborrhea', 'greasy skin', 'dandruff', 'scalp flakes', 'pityriasis'],
  ['hair loss', 'alopecia', 'baldness', 'falling hair', 'hair falling'],
  ['brittle nails', 'nail brittleness', 'fragile nails', 'splitting nails'],
  ['fungal infection', 'mycosis', 'ringworm', 'tinea', 'fungus'],
  ['athlete foot', 'tinea pedis', 'foot fungus'],
  ['burns', 'burn', 'scalds', 'burning skin', 'burning', 'burning sensation', 'scalding', 'hot sensation'],
  ['ulcer', 'ulceration', 'sore', 'open wound', 'soreness', 'tenderness', 'tender', 'bruised feeling', 'sensitive to touch'],
  ['wound', 'injury', 'laceration', 'cut', 'trauma', 'hurt', 'accident'],
  ['bruise', 'contusion', 'ecchymosis', 'black and blue'],
  ['swelling', 'edema', 'oedema', 'tumefaction', 'puffiness', 'dropsy', 'inflammation', 'fluid retention', 'heart failure', 'inflamed', 'redness', 'heat', 'cardiac failure', 'congestive heart failure'],
  ['cellulitis', 'skin infection', 'erysipelas', 'inflamed skin', 'red skin infection'],
  ['herpes', 'cold sore', 'fever blister', 'herpes simplex', 'vesicles'],
  ['shingles', 'herpes zoster', 'zoster', 'zona'],
  ['chickenpox', 'varicella', 'chicken pox'],
  ['measles', 'rubeola', 'morbilli'],
  ['german measles', 'rubella', 'three day measles'],
  ['scarlet fever', 'scarlatina', 'scarlet rash'],
  ['joint pain', 'arthralgia', 'articular pain', 'pain joints'],
  ['arthritis', 'joint inflammation', 'arthritic', 'inflamed joints'],
  ['rheumatism', 'rheumatic', 'rheumatic pain', 'muscular rheumatism', 'fibromyalgia', 'fibrositis', 'widespread pain'],
  ['gout', 'gouty', 'podagra', 'uric acid', 'gouty toe'],
  ['back pain', 'dorsalgia', 'lumbago', 'backache', 'lumbar pain', 'lower back pain'],
  ['sciatica', 'sciatic pain', 'leg pain radiating', 'sciatic nerve'],
  ['neck pain', 'cervicalgia', 'cervical pain', 'stiff neck', 'nape pain', 'torticollis', 'wry neck', 'neck stiffness'],
  ['muscle pain', 'myalgia', 'muscular pain', 'sore muscles'],
  ['muscle weakness', 'myasthenia', 'weak muscles', 'muscular weakness'],
  ['tendonitis', 'tendinitis', 'tendon inflammation', 'tendon pain'],
  ['bursitis', 'bursa inflammation', 'joint swelling'],
  ['sprain', 'ligament injury', 'twisted', 'strain', 'muscle strain', 'pulled muscle'],
  ['fracture', 'broken bone', 'bone fracture', 'break'],
  ['osteoporosis', 'brittle bones', 'bone loss', 'porous bones'],
  ['bone pain', 'osseous pain', 'ostealgia', 'aching bones'],
  ['heart palpitations', 'palpitation', 'racing heart', 'rapid heartbeat', 'tachycardia', 'pounding heart', 'fast heart', 'palpitations'],
  ['slow heartbeat', 'bradycardia', 'slow pulse'],
  ['irregular heartbeat', 'arrhythmia', 'irregular pulse', 'heart irregularity'],
  ['high blood pressure', 'hypertension', 'elevated blood pressure', 'elevated bp'],
  ['low blood pressure', 'hypotension', 'low bp'],
  ['varicose veins', 'varices', 'enlarged veins', 'venous insufficiency'],
  ['cold hands', 'cold extremities', 'poor circulation', 'raynaud', 'cold feet'],
  ['swollen ankles', 'ankle edema', 'ankle swelling', 'pedal edema'],
  ['anxiety', 'anxious', 'nervousness', 'apprehension', 'worry', 'fear', 'anguish', 'agitation', 'nervous', 'worried', 'apprehensive', 'fright', 'terror', 'phobia', 'restlessness', 'nervous excitement', 'shock', 'scared', 'restless', 'cannot sit still', 'fidgety', 'hysteria', 'collapse', 'prostration', 'trauma shock', 'agitated', 'hysterical', 'emotional outburst', 'exhaustion', 'faint', 'fatigue', 'weakness', 'extreme weakness', 'tiredness', 'debility', 'weariness', 'lassitude', 'asthenia', 'feebleness', 'lack of strength'],
  ['depression', 'melancholy', 'sadness', 'low mood', 'despondency', 'dejection', 'low spirits', 'grief', 'sorrow', 'bereavement', 'mourning'],
  ['anger', 'irritability', 'rage', 'fury', 'wrath', 'vexation', 'irritable', 'peevish', 'cross', 'fretful'],
  ['insomnia', 'sleeplessness', 'cannot sleep', 'wakeful', 'sleep difficulty'],
  ['drowsiness', 'somnolence', 'sleepy', 'lethargy', 'torpor', 'excessive sleep'],
  ['confusion', 'mental confusion', 'bewilderment', 'disorientation', 'befuddled', 'delirium', 'delirious', 'hallucination', 'raving', 'seeing things', 'visions'],
  ['memory loss', 'forgetfulness', 'amnesia', 'poor memory', 'memory weak', 'absent-minded'],
  ['concentration difficulty', 'poor concentration', 'cannot focus', 'distracted'],
  ['mania', 'manic', 'excitement', 'hyperactive'],
  ['hypochondria', 'hypochondriac', 'health anxiety', 'imaginary illness'],
  ['indifference', 'apathy', 'lack of interest', 'unconcerned', 'listless'],
  ['weeping', 'crying', 'tearful', 'lachrymose', 'sobbing'],
  ['mood swings', 'changeable mood', 'emotional instability', 'alternating mood'],
  ['suicidal thoughts', 'suicidal ideation', 'wants to die', 'death wish'],
  ['homesickness', 'nostalgia', 'longing for home', 'longing'],
  ['jealousy', 'envy', 'jealous', 'suspicious', 'suspicion', 'paranoia', 'distrust', 'persecution'],
  ['fever', 'pyrexia', 'febrile', 'high temperature', 'elevated temperature'],
  ['chills', 'chill', 'rigor', 'shivering', 'coldness', 'shaking chill', 'trembling cold'],
  ['sweating', 'perspiration', 'diaphoresis', 'sweat', 'hidrosis', 'profuse sweat'],
  ['night sweats', 'nocturnal sweating', 'sweating night', 'perspiration night'],
  ['cold sweat', 'clammy', 'cold perspiration'],
  ['malaise', 'general discomfort', 'unwell', 'ill feeling'],
  ['gangrene', 'necrosis', 'tissue death', 'mortification'],
  ['cancer', 'carcinoma', 'malignancy', 'tumor', 'neoplasm', 'tumour', 'growth', 'mass'],
  ['cyst', 'cystic', 'sac', 'fluid-filled'],
  ['allergy', 'allergic', 'hypersensitivity', 'allergic reaction'],
  ['anaphylaxis', 'severe allergy', 'allergic shock'],
  ['weight loss', 'emaciation', 'wasting', 'losing weight', 'thin', 'marasmus', 'failure to thrive', 'wasting infant', 'poor growth'],
  ['weight gain', 'obesity', 'gaining weight', 'corpulence', 'overweight'],
  ['teething', 'dentition', 'teeth eruption', 'cutting teeth'],
  ['colic infant', 'baby colic', 'infantile colic', 'griping infant'],
  ['diaper rash', 'nappy rash', 'diaper dermatitis'],
  ['cradle cap', 'seborrheic dermatitis infant', 'scalp crust'],
  ['rickets', 'rachitis', 'bone deformity', 'vitamin d deficiency', 'bone softening'],
  ['worse morning', 'aggravation morning', 'morning aggravation', 'am worse'],
  ['worse evening', 'aggravation evening', 'evening aggravation', 'pm worse'],
  ['worse night', 'aggravation night', 'night aggravation', 'nocturnal aggravation'],
  ['worse cold', 'aggravation cold', 'cold aggravates', 'cold air worse'],
  ['worse heat', 'aggravation heat', 'heat aggravates', 'warm worse'],
  ['worse motion', 'aggravation motion', 'movement worse', 'motion aggravates'],
  ['worse rest', 'aggravation rest', 'rest worse', 'lying worse'],
  ['better cold', 'amelioration cold', 'cold ameliorates', 'cold better'],
  ['better heat', 'amelioration heat', 'heat ameliorates', 'warmth better'],
  ['better motion', 'amelioration motion', 'motion better', 'movement better'],
  ['better rest', 'amelioration rest', 'rest better', 'lying better'],
  ['worse eating', 'aggravation eating', 'after eating worse', 'food aggravates'],
  ['better eating', 'amelioration eating', 'after eating better', 'food ameliorates'],
  ['worse pressure', 'aggravation pressure', 'pressure worse', 'touch worse'],
  ['better pressure', 'amelioration pressure', 'pressure better', 'firm pressure better'],
  ['stitching', 'stitch', 'stitching pain', 'stabbing', 'lancinating', 'piercing', 'shooting'],
  ['throbbing', 'pulsating', 'beating', 'pounding'],
  ['pressing', 'pressure', 'pressing pain', 'heaviness', 'heavy', 'weight'],
  ['rawness', 'raw', 'excoriated', 'abraded'],
  ['emptiness', 'empty', 'hollow', 'sinking feeling', 'sinking', 'gone feeling'],
  ['electric shock', 'electric sensation', 'shock-like', 'lightning pain'],
  ['flu', 'influenza', 'grippe', 'viral infection'],
  ['food poisoning', 'gastroenteritis', 'stomach flu', 'ptomaine', 'intestinal flu'],
  ['hangover', 'after drinking', 'alcohol effects', 'crapulous'],
  ['motion sickness', 'travel sickness', 'car sickness', 'sea sickness', 'nausea travel', 'nausea sea'],
  ['jet lag', 'travel fatigue', 'time zone change'],
  ['sunstroke', 'heat stroke', 'sun exposure', 'insolation', 'hyperthermia', 'overheating'],
  ['frostbite', 'chilblains', 'cold injury', 'frozen', 'pernio'],
  ['altitude sickness', 'mountain sickness', 'high altitude'],
  ['poisoning', 'intoxication', 'toxic', 'poisoned', 'toxic effects'],
  ['drug effects', 'medication effects', 'side effects', 'drug reaction'],
  ['vaccination effects', 'vaccine reaction', 'post vaccination'],
];

export const symptomSynonyms: Record<string, string[]> = {};

for (const group of canonicalGroups) {
  for (const term of group) {
    if (!symptomSynonyms[term]) {
      symptomSynonyms[term] = [];
    }
    for (const other of group) {
      if (term !== other && !symptomSynonyms[term].includes(other)) {
        symptomSynonyms[term].push(other);
      }
    }
  }
}

/**
 * Expands a single word with its synonyms
 * Returns array of all synonyms for that word (including the word itself)
 */
export function expandSingleWord(word: string): string[] {
  const normalizedWord = word.toLowerCase().trim();
  const terms = new Set<string>([normalizedWord]);
  
  // Check direct lookup
  if (symptomSynonyms[normalizedWord]) {
    symptomSynonyms[normalizedWord].forEach(syn => {
      // Only add single-word synonyms to avoid complex matching
      const synWords = syn.toLowerCase().split(/\s+/);
      if (synWords.length === 1) {
        terms.add(synWords[0]);
      }
    });
  }
  
  return Array.from(terms);
}

/**
 * Expands a multi-word search query
 * Returns an array of word groups, where each group contains synonyms for that word
 * 
 * Example: "itching bed" returns:
 * [
 *   ["itching", "pruritus", "itchy", "itch"],  // synonyms for "itching"
 *   ["bed"]                                      // synonyms for "bed"
 * ]
 * 
 * The search should match symptoms that contain at least one word from EACH group
 */
export function expandSearchTerms(query: string): string[][] {
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/).filter(Boolean);
  
  // Expand each word individually
  return words.map(word => expandSingleWord(word));
}

/**
 * Legacy function for backward compatibility
 * Returns flat array of all expanded terms
 */
export function getExpandedSearchWords(query: string): string[] {
  const wordGroups = expandSearchTerms(query);
  const allWords = new Set<string>();
  
  for (const group of wordGroups) {
    group.forEach(w => allWords.add(w));
  }
  
  return Array.from(allWords);
}
