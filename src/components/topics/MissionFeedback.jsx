// src/components/topics/MissionFeedback.jsx

import MissionConversationReview from "./feedback/MissionConversationReview";
import MissionCorrectionsFeedback from "./feedback/MissionCorrectionsFeedback";
import MissionCriteriaFeedback from "./feedback/MissionCriteriaFeedback";
import MissionFeedbackActions from "./feedback/MissionFeedbackActions";
import MissionFeedbackHeader from "./feedback/MissionFeedbackHeader";
import MissionFeedbackSummary from "./feedback/MissionFeedbackSummary";
import MissionLanguageFeedback from "./feedback/MissionLanguageFeedback";
import MissionObjectivesFeedback from "./feedback/MissionObjectivesFeedback";
import MissionStrengthsFeedback from "./feedback/MissionStrengthsFeedback";

import {
  MISSION_FEEDBACK_VIEW_STATUS,
  buildMissionFeedbackViewModel
} from "./feedback/missionFeedbackUtils";

const MissionFeedback = ({
  result,
  onRetry,
  onBackToMissions
}) => {
  if (!result) {
    return null;
  }

  const viewModel =
    buildMissionFeedbackViewModel(
      result
    );

  const {
    feedback,

    status,
    eyebrow,
    title,
    description,
    gradientClass,
    accentClass,
    iconType,

    score,
    stars,

    xpEarned,
    totalXp,
    xpReason,
    canAwardXp,
    alreadyCompleted,

    totalMessages,
    totalWords,
    level,
    confidence,

    objectivesCompleted,
    strengths,
    improvements,
    corrections,
    vocabulary,
    grammarTips,
    nextSteps,

    conversation
  } = viewModel;

  const isFinal =
    feedback?.isFinal === true &&
    feedback?.requiresReview !==
      true &&
    feedback?.isFallback !== true;

  const criteria =
    feedback?.criteria &&
    typeof feedback.criteria ===
      "object" &&
    !Array.isArray(
      feedback.criteria
    )
      ? feedback.criteria
      : {};

  const criteriaScore =
    Number.isFinite(
      Number(
        feedback?.criteriaScore
      )
    )
      ? Number(
          feedback.criteriaScore
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | Visibility policy
  |--------------------------------------------------------------------------
  |
  | Pending and unavailable evaluations may contain partial data, but the
  | interface must not present that information as a definitive result.
  |
  */

  const canShowPedagogicalFeedback =
    isFinal ||
    status ===
      MISSION_FEEDBACK_VIEW_STATUS
        .review;

  const canShowCriteria =
    Object.keys(criteria).length >
      0 &&
    canShowPedagogicalFeedback;

  const canShowObjectives =
    objectivesCompleted.length >
      0 &&
    canShowPedagogicalFeedback;

  const canShowStrengths =
    (
      strengths.length > 0 ||
      improvements.length > 0
    ) &&
    canShowPedagogicalFeedback;

  const canShowCorrections =
    corrections.length > 0 &&
    canShowPedagogicalFeedback;

  const canShowLanguageFeedback =
    (
      vocabulary.length > 0 ||
      grammarTips.length > 0 ||
      nextSteps.length > 0
    ) &&
    canShowPedagogicalFeedback;

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg">
      <MissionFeedbackHeader
        status={status}
        eyebrow={eyebrow}
        title={title}
        description={
          description
        }
        gradientClass={
          gradientClass
        }
        accentClass={
          accentClass
        }
        iconType={iconType}
        score={score}
        stars={stars}
        xpEarned={
          xpEarned
        }
        totalXp={totalXp}
        alreadyCompleted={
          alreadyCompleted
        }
      />

      <MissionFeedbackSummary
        status={status}
        totalMessages={
          totalMessages
        }
        totalWords={
          totalWords
        }
        level={level}
        confidence={
          confidence
        }
        alreadyCompleted={
          alreadyCompleted
        }
        canAwardXp={
          canAwardXp
        }
        xpReason={
          xpReason
        }
      />

      <div className="p-4 md:p-8">
        {canShowObjectives && (
          <MissionObjectivesFeedback
            objectives={
              objectivesCompleted
            }
          />
        )}

        {canShowCriteria && (
          <MissionCriteriaFeedback
            criteria={
              criteria
            }
            criteriaScore={
              criteriaScore
            }
          />
        )}

        {canShowStrengths && (
          <MissionStrengthsFeedback
            strengths={
              strengths
            }
            improvements={
              improvements
            }
            isFinal={
              isFinal
            }
          />
        )}

        {canShowCorrections && (
          <MissionCorrectionsFeedback
            corrections={
              corrections
            }
            isFinal={
              isFinal
            }
          />
        )}

        {canShowLanguageFeedback && (
          <MissionLanguageFeedback
            vocabulary={
              vocabulary
            }
            grammarTips={
              grammarTips
            }
            nextSteps={
              nextSteps
            }
            isFinal={
              isFinal
            }
          />
        )}

        <MissionConversationReview
          conversation={
            conversation
          }
        />

        <MissionFeedbackActions
          status={status}
          onRetry={
            onRetry
          }
          onBackToMissions={
            onBackToMissions
          }
        />
      </div>
    </section>
  );
};

export default MissionFeedback;
