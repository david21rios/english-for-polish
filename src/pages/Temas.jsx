// src/pages/Temas.jsx

import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import TopicEmptyState from "../components/topics/TopicEmptyState";
import TopicGrid from "../components/topics/TopicGrid";
import TopicIntro from "../components/topics/TopicIntro";
import TopicLoading from "../components/topics/TopicLoading";

import {
  getPublishedTopics
} from "../services/missions/topicCatalogService";

const Temas = () => {
  const [topics, setTopics] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const navigate =
    useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Load public topics
  |--------------------------------------------------------------------------
  */

  const loadTopics =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const publishedTopics =
          await getPublishedTopics();

        setTopics(
          Array.isArray(
            publishedTopics
          )
            ? publishedTopics
            : []
        );
      } catch (loadError) {
        console.error(
          "Error loading topics:",
          {
            code:
              loadError?.code,

            message:
              loadError?.message
          }
        );

        setTopics([]);

        setError(
          "Nie udało się załadować tematów. Spróbuj ponownie."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleTopicClick = (
    topicId
  ) => {
    const normalizedTopicId =
      String(topicId || "")
        .trim();

    if (!normalizedTopicId) {
      return;
    }

    navigate(
      `/tema/${normalizedTopicId}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | View
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-primary-50 to-white py-4 md:py-6">
      <div className="container mx-auto px-3 sm:px-4">
        <TopicIntro />

        <section className="rounded-3xl border border-gray-100 bg-white px-3 py-6 shadow-sm sm:px-6 md:py-12 lg:px-8 lg:py-16">
          {loading ? (
            <TopicLoading />
          ) : error ? (
            <TopicEmptyState
              title="Nie udało się załadować tematów"
              description={error}
              actionLabel="Spróbuj ponownie"
              onAction={loadTopics}
              loading={loading}
            />
          ) : topics.length === 0 ? (
            <TopicEmptyState />
          ) : (
            <TopicGrid
              temas={topics}
              handleTemaClick={
                handleTopicClick
              }
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default Temas;