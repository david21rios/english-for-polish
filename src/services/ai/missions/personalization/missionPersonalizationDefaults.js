// src/services/ai/missions/personalization/missionPersonalizationDefaults.js

import {
  PERSONALIZATION_COMPLEXITIES,
  PERSONALIZATION_CONVERSATION_TYPES,
  PERSONALIZATION_GRAMMAR_FOCUSES,
  PERSONALIZATION_LENGTHS,
  PERSONALIZATION_LEVELS,
  PERSONALIZATION_NPC_STYLES,
  PERSONALIZATION_VOCABULARY_FOCUSES
} from "./missionPersonalizationBuilder";

/*
|--------------------------------------------------------------------------
| Default form values
|--------------------------------------------------------------------------
*/

export const DEFAULT_PERSONALIZATION_FORM =
  Object.freeze({
    situation: "",
    goal: "",
    aiRole: "",

    level: "Adaptive",

    conversationType:
      "role_play",

    npcStyle:
      "adaptive",

    complexity:
      "adaptive",

    missionLength:
      "adaptive",

    vocabularyFocus:
      "no_preference",

    customVocabularyFocus:
      "",

    grammarFocus:
      "no_preference",

    customGrammarFocus:
      "",

    objectives: [],

    additionalInstructions:
      "",

    allowPolishSupport:
      true,

    requireObjectiveReview:
      true
  });

/*
|--------------------------------------------------------------------------
| Wizard steps
|--------------------------------------------------------------------------
*/

export const PERSONALIZATION_WIZARD_STEPS =
  Object.freeze([
    {
      id: "situation",
      order: 1,
      title:
        "Opisz sytuację",
      shortTitle:
        "Sytuacja",
      description:
        "Napisz, jaką prawdziwą sytuację chcesz przećwiczyć.",
      requiredFields: [
        "situation"
      ]
    },

    {
      id: "goal",
      order: 2,
      title:
        "Określ cel rozmowy",
      shortTitle:
        "Cel",
      description:
        "Wyjaśnij, co chcesz osiągnąć podczas misji.",
      requiredFields: [
        "goal"
      ]
    },

    {
      id: "npc",
      order: 3,
      title:
        "Wybierz rozmówcę AI",
      shortTitle:
        "Rozmówca",
      description:
        "Określ rolę oraz zachowanie postaci AI.",
      requiredFields: [
        "aiRole",
        "npcStyle"
      ]
    },

    {
      id: "parameters",
      order: 4,
      title:
        "Ustaw parametry",
      shortTitle:
        "Parametry",
      description:
        "Dostosuj poziom, długość, trudność, słownictwo i gramatykę.",
      requiredFields: [
        "level",
        "conversationType",
        "complexity",
        "missionLength"
      ]
    },

    {
      id: "preview",
      order: 5,
      title:
        "Sprawdź misję",
      shortTitle:
        "Podgląd",
      description:
        "Przejrzyj wygenerowany scenariusz przed rozpoczęciem rozmowy.",
      requiredFields: []
    }
  ]);

/*
|--------------------------------------------------------------------------
| Select option helpers
|--------------------------------------------------------------------------
*/

const createOption = ({
  value,
  label,
  description = "",
  icon = null
}) => {
  return {
    value,
    label,
    description,
    icon
  };
};

/*
|--------------------------------------------------------------------------
| Level options
|--------------------------------------------------------------------------
*/

export const PERSONALIZATION_LEVEL_OPTIONS =
  Object.freeze(
    PERSONALIZATION_LEVELS.map(
      (level) => {
        const descriptions = {
          A1:
            "Bardzo proste zdania i podstawowe słownictwo.",

          A2:
            "Proste rozmowy dotyczące codziennych sytuacji.",

          B1:
            "Samodzielna komunikacja w typowych sytuacjach.",

          B2:
            "Bardziej naturalna i szczegółowa rozmowa.",

          C1:
            "Płynna komunikacja i zaawansowane słownictwo.",

          C2:
            "Złożona, precyzyjna i naturalna komunikacja.",

          Adaptive:
            "AI dostosuje język do Twoich odpowiedzi."
        };

        return createOption({
          value: level,
          label:
            level === "Adaptive"
              ? "Adaptacyjny"
              : level,
          description:
            descriptions[level] ||
            ""
        });
      }
    )
  );

/*
|--------------------------------------------------------------------------
| Conversation types
|--------------------------------------------------------------------------
*/

const CONVERSATION_TYPE_CONFIG =
  Object.freeze({
    role_play: {
      label:
        "Odgrywanie ról",

      description:
        "Realistyczna rozmowa z jasno określoną rolą."
    },

    job_interview: {
      label:
        "Rozmowa kwalifikacyjna",

      description:
        "Ćwiczenie pytań rekrutacyjnych i autoprezentacji."
    },

    discussion: {
      label:
        "Dyskusja",

      description:
        "Wymiana opinii i argumentów na wybrany temat."
    },

    negotiation: {
      label:
        "Negocjacja",

      description:
        "Ćwiczenie proponowania, uzasadniania i osiągania porozumienia."
    },

    presentation: {
      label:
        "Prezentacja",

      description:
        "Ćwiczenie przedstawiania tematu oraz odpowiadania na pytania."
    },

    phone_call: {
      label:
        "Rozmowa telefoniczna",

      description:
        "Komunikacja bez wsparcia mimiki i gestów."
    },

    customer_service: {
      label:
        "Obsługa klienta",

      description:
        "Rozwiązywanie problemu klienta lub składanie reklamacji."
    },

    exam_preparation: {
      label:
        "Przygotowanie do egzaminu",

      description:
        "Ćwiczenie odpowiedzi podobnych do zadań egzaminacyjnych."
    },

    free_conversation: {
      label:
        "Swobodna rozmowa",

      description:
        "Naturalna rozmowa bez sztywnego schematu."
    }
  });

export const PERSONALIZATION_CONVERSATION_TYPE_OPTIONS =
  Object.freeze(
    PERSONALIZATION_CONVERSATION_TYPES.map(
      (value) =>
        createOption({
          value,

          label:
            CONVERSATION_TYPE_CONFIG[
              value
            ]?.label ||
            value,

          description:
            CONVERSATION_TYPE_CONFIG[
              value
            ]?.description ||
            ""
        })
    )
  );

/*
|--------------------------------------------------------------------------
| NPC styles
|--------------------------------------------------------------------------
*/

const NPC_STYLE_CONFIG =
  Object.freeze({
    friendly: {
      label:
        "Przyjazny",

      description:
        "Rozmówca jest cierpliwy, spokojny i pomocny."
    },

    professional: {
      label:
        "Profesjonalny",

      description:
        "Rozmówca zachowuje formalny i rzeczowy styl."
    },

    supportive: {
      label:
        "Wspierający",

      description:
        "Rozmówca zachęca do dalszej komunikacji."
    },

    neutral: {
      label:
        "Neutralny",

      description:
        "Rozmówca zachowuje spokojny i bezstronny ton."
    },

    serious: {
      label:
        "Poważny",

      description:
        "Rozmówca jest rzeczowy i mało emocjonalny."
    },

    strict: {
      label:
        "Surowy",

      description:
        "Rozmówca oczekuje konkretnych i poprawnych odpowiedzi."
    },

    impatient: {
      label:
        "Niecierpliwy",

      description:
        "Rozmówca oczekuje szybkich i jasnych odpowiedzi."
    },

    demanding: {
      label:
        "Wymagający",

      description:
        "Rozmówca zadaje trudniejsze pytania i prosi o szczegóły."
    },

    humorous: {
      label:
        "Z poczuciem humoru",

      description:
        "Rozmówca prowadzi lekką i swobodną rozmowę."
    },

    adaptive: {
      label:
        "Adaptacyjny",

      description:
        "AI dopasuje zachowanie do przebiegu rozmowy."
    }
  });

export const PERSONALIZATION_NPC_STYLE_OPTIONS =
  Object.freeze(
    PERSONALIZATION_NPC_STYLES.map(
      (value) =>
        createOption({
          value,

          label:
            NPC_STYLE_CONFIG[
              value
            ]?.label ||
            value,

          description:
            NPC_STYLE_CONFIG[
              value
            ]?.description ||
            ""
        })
    )
  );

/*
|--------------------------------------------------------------------------
| Complexity options
|--------------------------------------------------------------------------
*/

const COMPLEXITY_CONFIG =
  Object.freeze({
    easy: {
      label:
        "Łatwa",

      description:
        "Proste pytania, krótkie odpowiedzi i spokojne tempo."
    },

    normal: {
      label:
        "Normalna",

      description:
        "Naturalna rozmowa o umiarkowanym poziomie trudności."
    },

    challenging: {
      label:
        "Wymagająca",

      description:
        "Więcej pytań, szczegółów oraz nieprzewidzianych sytuacji."
    },

    adaptive: {
      label:
        "Adaptacyjna",

      description:
        "Trudność zmieni się na podstawie jakości odpowiedzi."
    }
  });

export const PERSONALIZATION_COMPLEXITY_OPTIONS =
  Object.freeze(
    PERSONALIZATION_COMPLEXITIES.map(
      (value) =>
        createOption({
          value,

          label:
            COMPLEXITY_CONFIG[
              value
            ]?.label ||
            value,

          description:
            COMPLEXITY_CONFIG[
              value
            ]?.description ||
            ""
        })
    )
  );

/*
|--------------------------------------------------------------------------
| Length options
|--------------------------------------------------------------------------
*/

const LENGTH_CONFIG =
  Object.freeze({
    short: {
      label:
        "Krótka",

      description:
        "Około 5 minut i kilka krótkich wymian."
    },

    medium: {
      label:
        "Średnia",

      description:
        "Około 10 minut i bardziej rozbudowana rozmowa."
    },

    long: {
      label:
        "Długa",

      description:
        "Około 15–20 minut i większa liczba celów."
    },

    adaptive: {
      label:
        "Adaptacyjna",

      description:
        "Długość zostanie dopasowana do przebiegu rozmowy."
    }
  });

export const PERSONALIZATION_LENGTH_OPTIONS =
  Object.freeze(
    PERSONALIZATION_LENGTHS.map(
      (value) =>
        createOption({
          value,

          label:
            LENGTH_CONFIG[
              value
            ]?.label ||
            value,

          description:
            LENGTH_CONFIG[
              value
            ]?.description ||
            ""
        })
    )
  );

/*
|--------------------------------------------------------------------------
| Vocabulary options
|--------------------------------------------------------------------------
*/

const VOCABULARY_CONFIG =
  Object.freeze({
    no_preference: {
      label:
        "Bez preferencji",

      description:
        "AI dobierze słownictwo do scenariusza."
    },

    daily_life: {
      label:
        "Życie codzienne",

      description:
        "Podstawowe słownictwo używane w codziennych sytuacjach."
    },

    travel: {
      label:
        "Podróże",

      description:
        "Lotniska, hotele, transport i zwiedzanie."
    },

    business: {
      label:
        "Biznes",

      description:
        "Spotkania, współpraca, projekty i komunikacja zawodowa."
    },

    job_interview: {
      label:
        "Rozmowa kwalifikacyjna",

      description:
        "Doświadczenie, umiejętności, motywacja i pytania rekrutacyjne."
    },

    academic: {
      label:
        "Akademickie",

      description:
        "Studia, badania, prezentacje i wypowiedzi formalne."
    },

    technology: {
      label:
        "Technologia",

      description:
        "Oprogramowanie, urządzenia, projekty i problemy techniczne."
    },

    customer_service: {
      label:
        "Obsługa klienta",

      description:
        "Reklamacje, prośby, wyjaśnienia i rozwiązywanie problemów."
    },

    medical: {
      label:
        "Zdrowie",

      description:
        "Objawy, wizyty lekarskie i podstawowe potrzeby zdrowotne."
    },

    social: {
      label:
        "Rozmowy społeczne",

      description:
        "Poznawanie ludzi, small talk i relacje."
    },

    custom: {
      label:
        "Własny zakres",

      description:
        "Samodzielnie określ słownictwo, które chcesz przećwiczyć."
    }
  });

export const PERSONALIZATION_VOCABULARY_OPTIONS =
  Object.freeze(
    PERSONALIZATION_VOCABULARY_FOCUSES.map(
      (value) =>
        createOption({
          value,

          label:
            VOCABULARY_CONFIG[
              value
            ]?.label ||
            value,

          description:
            VOCABULARY_CONFIG[
              value
            ]?.description ||
            ""
        })
    )
  );

/*
|--------------------------------------------------------------------------
| Grammar options
|--------------------------------------------------------------------------
*/

const GRAMMAR_CONFIG =
  Object.freeze({
    no_preference: {
      label:
        "Bez preferencji",

      description:
        "AI dobierze struktury gramatyczne odpowiednie do poziomu."
    },

    present_simple: {
      label:
        "Present Simple",

      description:
        "Nawyki, fakty i codzienne czynności."
    },

    past_tenses: {
      label:
        "Czasy przeszłe",

      description:
        "Opisywanie wydarzeń, doświadczeń i historii."
    },

    future_forms: {
      label:
        "Formy przyszłe",

      description:
        "Plany, przewidywania, decyzje i zamiary."
    },

    questions: {
      label:
        "Pytania",

      description:
        "Tworzenie pytań i reagowanie na odpowiedzi."
    },

    prepositions: {
      label:
        "Przyimki",

      description:
        "Przyimki miejsca, czasu i kierunku."
    },

    modal_verbs: {
      label:
        "Czasowniki modalne",

      description:
        "Możliwość, obowiązek, porada i pozwolenie."
    },

    conditionals: {
      label:
        "Tryby warunkowe",

      description:
        "Rozmowy o możliwościach, skutkach i hipotetycznych sytuacjach."
    },

    passive_voice: {
      label:
        "Strona bierna",

      description:
        "Formalne opisywanie procesów, działań i rezultatów."
    },

    reported_speech: {
      label:
        "Mowa zależna",

      description:
        "Relacjonowanie wypowiedzi innych osób."
    },

    custom: {
      label:
        "Własny zakres",

      description:
        "Samodzielnie określ element gramatyczny."
    }
  });

export const PERSONALIZATION_GRAMMAR_OPTIONS =
  Object.freeze(
    PERSONALIZATION_GRAMMAR_FOCUSES.map(
      (value) =>
        createOption({
          value,

          label:
            GRAMMAR_CONFIG[
              value
            ]?.label ||
            value,

          description:
            GRAMMAR_CONFIG[
              value
            ]?.description ||
            ""
        })
    )
  );

/*
|--------------------------------------------------------------------------
| Example templates
|--------------------------------------------------------------------------
*/

export const PERSONALIZATION_EXAMPLES =
  Object.freeze([
    {
      id:
        "job_interview",

      title:
        "Rozmowa kwalifikacyjna",

      topicHint:
        "Work",

      situation:
        "Jutro mam rozmowę kwalifikacyjną na stanowisko programisty. Chcę przećwiczyć pytania dotyczące mojego doświadczenia i projektów.",

      goal:
        "Chcę przedstawić swoje doświadczenie, opowiedzieć o projekcie i zadać pytania o stanowisko.",

      aiRole:
        "Doświadczony rekruter techniczny",

      level:
        "B1",

      conversationType:
        "job_interview",

      npcStyle:
        "professional",

      complexity:
        "normal",

      missionLength:
        "medium",

      vocabularyFocus:
        "job_interview",

      grammarFocus:
        "past_tenses"
    },

    {
      id:
        "hotel_problem",

      title:
        "Problem w hotelu",

      topicHint:
        "Travel",

      situation:
        "Jestem w hotelu, ale mój pokój nie jest gotowy i chcę porozmawiać z recepcjonistą.",

      goal:
        "Chcę wyjaśnić problem, zapytać o rozwiązanie i poprosić o pomoc.",

      aiRole:
        "Recepcjonista hotelowy",

      level:
        "A2",

      conversationType:
        "customer_service",

      npcStyle:
        "professional",

      complexity:
        "easy",

      missionLength:
        "short",

      vocabularyFocus:
        "travel",

      grammarFocus:
        "questions"
    },

    {
      id:
        "presentation",

      title:
        "Prezentacja projektu",

      topicHint:
        "Study",

      situation:
        "Muszę przedstawić krótki projekt przed grupą i później odpowiedzieć na pytania.",

      goal:
        "Chcę jasno przedstawić główne punkty projektu i odpowiedzieć na pytania słuchaczy.",

      aiRole:
        "Nauczyciel oraz uczestnik prezentacji",

      level:
        "B2",

      conversationType:
        "presentation",

      npcStyle:
        "demanding",

      complexity:
        "challenging",

      missionLength:
        "medium",

      vocabularyFocus:
        "academic",

      grammarFocus:
        "no_preference"
    }
  ]);

/*
|--------------------------------------------------------------------------
| Default form factory
|--------------------------------------------------------------------------
|
| A factory is used instead of returning DEFAULT_PERSONALIZATION_FORM
| directly, preventing accidental mutation of the shared constant.
|
*/

export const createDefaultPersonalizationForm =
  (
    overrides = {}
  ) => {
    return {
      ...DEFAULT_PERSONALIZATION_FORM,
      ...overrides,

      objectives:
        Array.isArray(
          overrides.objectives
        )
          ? [...overrides.objectives]
          : []
    };
  };

/*
|--------------------------------------------------------------------------
| Example form factory
|--------------------------------------------------------------------------
*/

export const createPersonalizationFormFromExample =
  (
    exampleId
  ) => {
    const example =
      PERSONALIZATION_EXAMPLES.find(
        (item) =>
          item.id ===
          exampleId
      );

    if (!example) {
      return createDefaultPersonalizationForm();
    }

    return createDefaultPersonalizationForm({
      ...example
    });
  };

export default {
  DEFAULT_PERSONALIZATION_FORM,
  PERSONALIZATION_WIZARD_STEPS,

  PERSONALIZATION_LEVEL_OPTIONS,
  PERSONALIZATION_CONVERSATION_TYPE_OPTIONS,
  PERSONALIZATION_NPC_STYLE_OPTIONS,
  PERSONALIZATION_COMPLEXITY_OPTIONS,
  PERSONALIZATION_LENGTH_OPTIONS,
  PERSONALIZATION_VOCABULARY_OPTIONS,
  PERSONALIZATION_GRAMMAR_OPTIONS,

  PERSONALIZATION_EXAMPLES,

  createDefaultPersonalizationForm,
  createPersonalizationFormFromExample
};