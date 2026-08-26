export const roleLabels = {
  ADMIN: 'Admin',
  THERAPIST: 'Therapist',
  PATIENT: 'Patient',
};

export const patientNavItems = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'treatment', label: 'Treatment', emoji: '🌿' },
  { id: 'appointments', label: 'Appointments', emoji: '🗓️' },
  { id: 'wellness', label: 'Wellness', emoji: '🩷' },
];

export const roleMenus = {
  ADMIN: [
    'Create Therapist',
  ],
  THERAPIST: [
    'Manage Sessions',
    'My Patients',
    'Wallet & Earnings',
    'Manage Availability',
  ],
  PATIENT: [
    'Home',
    'Treatment',
    'Appointments',
    'Wellness',
  ],
};

export const recoveryTrend = [
  { session: 'S1', pain: 8, sleep: 4, energy: 3 },
  { session: 'S2', pain: 7, sleep: 5, energy: 4 },
  { session: 'S3', pain: 6, sleep: 6, energy: 5 },
  { session: 'S4', pain: 5, sleep: 7, energy: 6 },
  { session: 'S5', pain: 4, sleep: 8, energy: 7 },
];

export const predictions = [
  { label: 'Poor', color: 'bg-rose-500', range: '< 40%' },
  { label: 'Moderate', color: 'bg-amber-500', range: '40 - 60%' },
  { label: 'Good', color: 'bg-lime-500', range: '61 - 80%' },
  { label: 'Excellent', color: 'bg-emerald-600', range: '> 80%' },
];

export const doshaAssessmentFields = [
  {
    key: 'bodyBuild',
    label: '1. What is your body build?',
    options: ['Thin and lean', 'Medium and athletic', 'Broad and sturdy'],
  },
  {
    key: 'skinType',
    label: '2. What is your skin type?',
    options: ['Dry and rough', 'Warm and sensitive', 'Soft and oily'],
  },
  {
    key: 'appetite',
    label: '3. How is your appetite?',
    options: ['Irregular', 'Strong and frequent', 'Moderate and steady'],
  },
  {
    key: 'digestion',
    label: '4. How is your digestion?',
    options: ['Gas or bloating', 'Acidity or heartburn', 'Slow digestion'],
  },
  {
    key: 'sleepPattern',
    label: '5. How do you sleep?',
    options: ['Light and interrupted', 'Moderate', 'Deep and long'],
  },
  {
    key: 'energyLevel',
    label: '6. How is your energy level?',
    options: ['Variable', 'Active and energetic', 'Calm and steady'],
  },
  {
    key: 'stressResponse',
    label: '7. How do you react to stress?',
    options: ['Anxious or worried', 'Irritated or angry', 'Calm or withdrawn'],
  },
  {
    key: 'climatePreference',
    label: '8. Which climate do you prefer?',
    options: ['Warm', 'Cool', 'Dry or moderate'],
  },
  {
    key: 'walkingStyle',
    label: '9. How do you usually walk?',
    options: ['Fast', 'Moderate', 'Slow and steady'],
  },
  {
    key: 'personality',
    label: '10. How would you describe your personality?',
    options: ['Creative and enthusiastic', 'Confident and ambitious', 'Calm and patient'],
  },
];

export const doshaTherapies = {
  VATA: ['Abhyanga', 'Basti', 'Shirodhara'],
  PITTA: ['Shirodhara', 'Virechana'],
  KAPHA: ['Udvartana', 'Nasya', 'Vamana'],
  VATA_PITTA: ['Abhyanga', 'Shirodhara', 'Cooling Therapies'],
  VATA_KAPHA: ['Abhyanga', 'Udvartana', 'Basti'],
  PITTA_KAPHA: ['Shirodhara', 'Virechana', 'Udvartana'],
  TRIDOSHA: ['Abhyanga', 'Shirodhara', 'Balanced Diet Consultation'],
};

export const doshaDietRecommendations = {
  VATA: {
    doshaName: 'Vata',
    tagline: 'Warm, Grounding & Nourishing Diet',
    keyPrinciples: 'Favor warm, cooked, unctuous, naturally sweet, sour, and salty foods. Avoid cold, dry, raw foods.',
    bestMealTiming: 'Eat meals at regular set times. Heavy lunch between 12:00 PM – 1:30 PM, light warm dinner before 7:30 PM.',
    pathya: [
      'Warm Basmati Rice, Oats, Wheat & Kitchari with Cow Ghee',
      'Warm Soups, Root Vegetables (Sweet Potato, Carrots, Beets)',
      'Sweet Fruits (Ripe Bananas, Avocados, Stewed Apples, Mangoes)',
      'Warm Cow Milk with a pinch of Nutmeg or Cardamom',
      'Mild Spices (Ginger, Cumin, Cinnamon, Cardamom, Fennel)'
    ],
    apathya: [
      'Raw Salads, Raw Vegetables & Ice Cold Water / Drinks',
      'Dry & Crunchy Snacks (Popcorn, Rice Cakes, Dry Crackers)',
      'Caffeinated Beverages, Strong Coffee & Energy Drinks',
      'Bitter & Astringent Raw Legumes without Ghee/Spices',
      'Frozen Foods, Excess White Sugar & Pungent Chili'
    ]
  },
  PITTA: {
    doshaName: 'Pitta',
    tagline: 'Cooling, Soothing & Moderately Dense Diet',
    keyPrinciples: 'Favor cooling, refreshing foods with sweet, bitter, and astringent tastes. Avoid excessively hot, spicy, or sour foods.',
    bestMealTiming: 'Substantial lunch between 12:00 PM – 1:30 PM when Agni is strongest. Avoid skipping meals.',
    pathya: [
      'Cooling Grains (White Rice, Barley, Oats, Quinoa)',
      'Pure Cow Ghee, Fresh Coconut Water & Cooling Oils',
      'Cooling Veggies (Cucumber, Zucchini, Leafy Greens, Broccoli)',
      'Sweet Fruits (Melons, Sweet Grapes, Pomegranates, Berries)',
      'Soothing Teas (Fennel, Mint, Coriander Tea, Chamomile)'
    ],
    apathya: [
      'Hot Chili, Jalapeños, Raw Garlic, Mustard & Excessive Pepper',
      'Sour & Fermented Foods (Pickles, Vinegar, Alcohol, Sour Curd)',
      'Deep Fried Oily Snacks & Excess Salt',
      'Heavy Red Meats & Aged Cheeses',
      'Excess Coffee, Carbonated Sodas & Hot Beverages'
    ]
  },
  KAPHA: {
    doshaName: 'Kapha',
    tagline: 'Light, Warm, Dry & Stimulating Diet',
    keyPrinciples: 'Favor light, warm, well-spiced foods with bitter, pungent, and astringent tastes. Avoid heavy, cold, oily, and sweet foods.',
    bestMealTiming: 'Light breakfast or warm ginger water. Substantial lunch, and light early dinner before 7:00 PM.',
    pathya: [
      'Light Grains (Barley, Millet, Buckwheat, Quinoa, Roasted Oats)',
      'Mung Dal Soup, Red Lentils & Steamed Sprouts',
      'Pungent/Bitter Veggies (Spinach, Radish, Cabbage, Cauliflower)',
      'Astringent Fruits (Apples, Pears, Pomegranates, Berries)',
      'Warming Spices (Ginger, Black Pepper, Turmeric, Mustard Seeds)'
    ],
    apathya: [
      'Heavy Oily Foods, Creamy Sauces & Deep Fried Snacks',
      'Cold Dairy (Ice Cream, Heavy Cream, Cold Milk, Rich Cheeses)',
      'Excess Refined Sugar, Wheat & Sweets',
      'Chilled Water, Iced Teas & Excess Bananas / Avocados',
      'Salt-heavy Processed Snacks & Fatty Meats'
    ]
  },
  VATA_PITTA: {
    doshaName: 'Vata-Pitta',
    tagline: 'Warm & Soothing Dual-Dosha Diet',
    keyPrinciples: 'Balance Vata with warmth and healthy fats while calming Pitta with mild, sweet, and cooling non-spicy foods.',
    bestMealTiming: 'Regular meal schedule. Substantial lunch, light warm dinner. Avoid spicy or cold foods.',
    pathya: [
      'Basmati Rice, Steamed Veggies (Zucchini, Carrots, Sweet Potato)',
      'Cow Ghee, Mung Dal & Warm Coconut Milk',
      'Sweet Fruits (Ripe Mangoes, Sweet Berries, Pomegranates)',
      'Cooling Warm Teas (Fennel, Cardamom, Chamomile)'
    ],
    apathya: [
      'Extremely Spicy Chili, Jalapeños & Hot Peppers',
      'Ice Cold Beverages & Frozen Desserts',
      'Dry Raw Salads & Crunchy Chips',
      'Excess Coffee, Alcohol & Fermented Foods'
    ]
  },
  VATA_KAPHA: {
    doshaName: 'Vata-Kapha',
    tagline: 'Warm, Light & Well-Spiced Diet',
    keyPrinciples: 'Keep food warm and digestible for Vata, while keeping it light and low-oil for Kapha.',
    bestMealTiming: 'Sip warm ginger water in morning. Warm cooked lunch and early light dinner.',
    pathya: [
      'Warm Rice, Mung Dal Soup & Steamed Seasonal Vegetables',
      'Spices (Ginger, Cumin, Turmeric, Cinnamon, Fennel)',
      'Steamed Apples, Pomegranates & Warm Water with Honey',
      'Herbal Teas (Tulsi, Ginger, Cumin-Coriander-Fennel)'
    ],
    apathya: [
      'Ice Cold Water, Cold Soda & Heavy Cold Dairy (Ice Cream, Cold Milk)',
      'Raw Cold Vegetables & Dry Snacks',
      'Excess Refined Sugars & Deep Fried Heavy Foods',
      'Heavy Fatty Meats & Rich Cheeses'
    ]
  },
  PITTA_KAPHA: {
    doshaName: 'Pitta-Kapha',
    tagline: 'Cooling, Light & Moderate Diet',
    keyPrinciples: 'Cool Pitta heat while keeping meals light and non-greasy for Kapha.',
    bestMealTiming: 'Nutritious lunch between 12:00 PM – 1:30 PM. Light dinner before 7:30 PM.',
    pathya: [
      'Barley, White Rice, Quinoa & Mung Dal Soup',
      'Leafy Greens, Broccoli, Cucumber, Zucchini & Steamed Veggies',
      'Apples, Pomegranates, Sweet Berries & Fresh Coconut Water',
      'Mint Tea, Fennel Tea & Warm Water'
    ],
    apathya: [
      'Deep Fried Fatty Foods, Heavy Meats & Aged Cheese',
      'Excess Red Chili, Hot Sauces & Pickles',
      'Alcohol, Tobacco & Excess Sugary Desserts',
      'Heavy Cream & Excess Salt'
    ]
  },
  TRIDOSHA: {
    doshaName: 'Tridosha',
    tagline: 'Balanced Sattvic Harmony Diet',
    keyPrinciples: 'Maintain natural internal harmony with fresh, wholesome, easily digestible Sattvic meals.',
    bestMealTiming: 'Eat mindfully at consistent daily times. Peak lunch at midday.',
    pathya: [
      'Fresh Kitchari (Rice & Mung Dal with Ghee & Cumin)',
      'Freshly Cooked Seasonal Vegetables & Sweet Fruits',
      'Pure Cow Ghee, Soaked Almonds & Coconut Water',
      'Mild Herbal Teas (Tulsi, Ginger, Fennel)'
    ],
    apathya: [
      'Processed, Canned & Stale Leftover Foods',
      'Extreme Food Temperatures (Scorching hot or Iced cold)',
      'Excessive Spice, Excess Salt & Artificial Sweets',
      'Overeating & Eating under stress or rush'
    ]
  }
};

