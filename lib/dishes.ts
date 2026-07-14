export type Dish = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  c: string;
};

export const DISHES: Dish[] = [
  { id: 'kottu', name: 'Kottu', emoji: '🥘', blurb: 'chop-chop-chop — you can hear it, no?', c: '#ffd9a8' },
  { id: 'biryani', name: 'Chicken Biryani', emoji: '🍗', blurb: 'wedding-grade. aunty approved.', c: '#ffe9a8' },
  { id: 'hoppers', name: 'Egg Hoppers', emoji: '🍳', blurb: 'crispy edges, runny middle. perfect.', c: '#fff3d0' },
  { id: 'string', name: 'String Hoppers & Dhal', emoji: '🍜', blurb: '20 minimum, or why even.', c: '#ffe0d0' },
  { id: 'watalappan', name: 'A Whole Watalappan', emoji: '🍮', blurb: 'the WHOLE thing. no sharing.', c: '#e8d5c0' },
  { id: 'isso', name: 'Isso Wade', emoji: '🦐', blurb: 'Galle Face classic, extra crunch.', c: '#ffd0c0' },
  { id: 'pizza', name: 'Full Pizza', emoji: '🍕', blurb: 'all 8 slices. zero guilt.', c: '#ffdfc0' },
  { id: 'sushi', name: 'Sushi Stack', emoji: '🍣', blurb: 'fancy machan energy.', c: '#d8f0e0' },
  { id: 'cake', name: 'Birthday Cake', emoji: '🎂', blurb: "it's not even your birthday.", c: '#ffd8e8' },
  { id: 'boba', name: 'Bubble Tea', emoji: '🧋', blurb: '50% sugar, 100% fake.', c: '#e0d8f8' },
  { id: 'pittu', name: 'Pittu', emoji: '🥥', blurb: 'steamed logs of joy. coconut mandatory.', c: '#fff3d0' },
  { id: 'parippu', name: 'Parippu', emoji: '🍛', blurb: 'the national hug, in curry form.', c: '#ffe9a8' },
  { id: 'murukku', name: 'Murukku', emoji: '🥨', blurb: 'crunchy spirals. impossible to stop.', c: '#ffd9a8' },
  { id: 'kiribath', name: 'Kiribath', emoji: '🍚', blurb: 'new year energy, any day.', c: '#e7f4f0' },
  { id: 'polsambol', name: 'Pol Sambol', emoji: '🌶️', blurb: 'fire + coconut = perfection.', c: '#ffd0c0' },
  { id: 'lamprais', name: 'Lamprais', emoji: '🍱', blurb: 'banana-leaf parcel. Dutch approved.', c: '#d8f0e0' },
  { id: 'ambulthiyal', name: 'Ambul Thiyal', emoji: '🐟', blurb: 'sour fish, big flavour.', c: '#cdeafc' },
  { id: 'chickencurry', name: 'Chicken Curry', emoji: '🍲', blurb: "amma's recipe. non-negotiable.", c: '#ffdfc0' },
  { id: 'rolls', name: 'Chinese Rolls', emoji: '🌯', blurb: 'not Chinese. still elite.', c: '#ffe0d0' },
  { id: 'cutlets', name: 'Fish Cutlets', emoji: '🧆', blurb: 'party legend. gone in seconds.', c: '#e8d5c0' },
  { id: 'patties', name: 'Patties', emoji: '🥟', blurb: 'crispy half-moons of happiness.', c: '#ffe9a8' },
  { id: 'maalupaan', name: 'Maalu Paan', emoji: '🥐', blurb: 'bakery-bus classic.', c: '#ffd9a8' },
  { id: 'kimbula', name: 'Kimbula Banis', emoji: '🍞', blurb: 'crocodile bun. sugar crystals. bite it.', c: '#fff3d0' },
  { id: 'faluda', name: 'Faluda', emoji: '🥤', blurb: 'pink, cold, dramatic.', c: '#ffd8e8' },
  { id: 'curd', name: 'Curd & Treacle', emoji: '🍯', blurb: 'clay pot. kithul. heaven.', c: '#ffe9a8' },
  { id: 'achcharu', name: 'Achcharu', emoji: '🥭', blurb: 'sour, spicy, eyes watering. worth it.', c: '#ffdfc0' },
  { id: 'kokis', name: 'Kokis', emoji: '🌼', blurb: 'crispy avurudu flowers.', c: '#fff3d0' },
  { id: 'kavum', name: 'Kavum', emoji: '🍩', blurb: 'oil cake royalty.', c: '#e8d5c0' },
  { id: 'thambili', name: 'Thambili', emoji: '🍈', blurb: 'roadside king coconut. hydration deluxe.', c: '#d8f0e0' },
  { id: 'eggroti', name: 'Egg Roti', emoji: '🫓', blurb: "kottu's chill cousin.", c: '#ffe0d0' },
];

export function findDish(id: string): Dish {
  return DISHES.find((d) => d.id === id) || DISHES[0];
}
