// src/components/topics/MissionPlayer.jsx

import {
  FaBolt
} from "react-icons/fa";

import MissionChat from "./player/MissionChat";
import MissionFinishPanel from "./player/MissionFinishPanel";
import MissionHeader from "./player/MissionHeader";
import MissionInput from "./player/MissionInput";
import MissionObjectives from "./player/MissionObjectives";
import MissionProgress from "./player/MissionProgress";
import MissionWarnings from "./player/MissionWarnings";

import useMissionPlayer from "./player/useMissionPlayer";

const MissionPlayer = ({
  mission,
  userContext,
  topic,
  onBack,
  onComplete
}) => {
  const {
    message,
    setMessage,

    messages,

    validationMessage,
    setValidationMessage,

    warningMessage,
    warningType,
    dismissWarning,
    retryLastMessage,

    openingLoading,
    aiLoading,
    finishingMission,

    minimumReplies,
    userMessagesCount,
    minimumReplyCountReached,
    remainingReplies,
    progressPercent,

    maximumMessageCharacters,
    interactionDisabled,

    chatEndRef,

    handleSubmitMessage,
    handleCompleteMission
  } = useMissionPlayer({
    mission,
    userContext,
    topic,
    onComplete
  });

  if (!mission) {
    return null;
  }

  const objectives = Array.isArray(
    mission.objectives
  )
    ? mission.objectives
    : [];

  const canRetryWarning =
    Boolean(
      warningMessage &&
      retryLastMessage
    );

  const handleMessageChange = (
    nextValue
  ) => {
    setMessage(nextValue);

    if (validationMessage) {
      setValidationMessage("");
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg">
      <MissionHeader
        mission={mission}
        onBack={onBack}
        disabled={
          aiLoading ||
          finishingMission
        }
      />

      <div className="p-4 md:p-8">
        <MissionObjectives
          scenario={
            mission.scenario
          }
          objectives={
            objectives
          }
        />

        <MissionWarnings
          message={
            warningMessage
          }
          type={
            warningType
          }
          onRetry={
            canRetryWarning
              ? retryLastMessage
              : null
          }
          onDismiss={
            dismissWarning
          }
          retrying={
            aiLoading
          }
        />

        <MissionProgress
          userMessagesCount={
            userMessagesCount
          }
          minimumReplies={
            minimumReplies
          }
          progressPercent={
            progressPercent
          }
        />

        <MissionChat
          messages={
            messages
          }
          openingLoading={
            openingLoading
          }
          aiLoading={
            aiLoading
          }
          chatEndRef={
            chatEndRef
          }
        />

        <MissionInput
          value={
            message
          }
          onChange={
            handleMessageChange
          }
          onSubmit={
            handleSubmitMessage
          }
          validationMessage={
            validationMessage
          }
          disabled={
            interactionDisabled
          }
          sending={
            aiLoading
          }
          maximumCharacters={
            maximumMessageCharacters
          }
        />

        <MissionFinishPanel
          minimumReplyCountReached={
            minimumReplyCountReached
          }
          remainingReplies={
            remainingReplies
          }
          finishing={
            finishingMission
          }
          disabled={
            interactionDisabled
          }
          onFinish={
            handleCompleteMission
          }
        />

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800 md:text-sm">
          <div className="flex items-start gap-2">
            <FaBolt className="mt-1 shrink-0" />

            <p className="leading-relaxed">
              Skup się na wykonaniu zadania i naturalnej komunikacji.
              Asystent nie poprawia błędów podczas rozmowy. Szczegółową
              informację zwrotną otrzymasz po zakończeniu misji.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionPlayer;
