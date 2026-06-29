// Contact.jsx
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { FaPaperPlane, FaEnvelope, FaCheck, FaExclamationCircle, FaCoffee } from "react-icons/fa";

const Contact = () => {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setSending(true);
    setError("");

    try {
      await addDoc(collection(db, "messages"), {
        message,
        createdAt: serverTimestamp(),
        userId: auth.currentUser ? auth.currentUser.uid : "anon"
      });
      setSent(true);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send the message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleNewMessage = () => {
    setSent(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Support me with a coffee section */}
        <div className="text-center">
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <FaCoffee className="h-8 w-8 text-yellow-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Support me with a coffee!
            </h2>

            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              If you find this resource useful and want to support its development, any contribution is welcome. Your support helps maintain and improve the platform!
            </p>

            {/* PayPal button for donations */}
            <form action="https://www.paypal.com/donate" method="post" target="_blank">
              <input type="hidden" name="business" value="david.rios0627@gmail.com" />
              <input type="hidden" name="currency_code" value="USD" />
              <input type="hidden" name="no_note" value="1" />
              <input type="hidden" name="no_shipping" value="1" />

              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-[#0070ba] hover:bg-[#003087] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0070ba] transition-colors duration-200"
              >
                <img
                  src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png"
                  alt="PayPal"
                  className="h-5 mr-2"
                />
                Donate
              </button>
            </form>

            {/* Security notice */}
            <p className="mt-4 text-sm text-gray-500">
              Donations are securely processed through PayPal. We do not store any payment information.
            </p>

            {/* Ko-fi alternative link */}
            <div className="mt-4 text-sm text-gray-500">
              You can also support me via{" "}
              <a
                href="https://ko-fi.com/TU_USUARIO"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                Ko-fi
              </a>
            </div>
          </div>
        </div>

        {/* Contact section */}
        <div>
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-100 rounded-full p-3">
                <FaEnvelope className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're here to help you. Send us your message and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
            {sent ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <FaCheck className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Message sent successfully!
                </h3>
                <p className="text-gray-600 mb-6">
                  Thank you for contacting us. We'll get back to you soon.
                </p>
                <button
                  onClick={handleNewMessage}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="space-y-6">
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Your message
                  </label>
                  <textarea
                    id="message"
                    rows="6"
                    className={`block w-full rounded-lg shadow-sm border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all duration-200 ${error ? 'border-red-300' : ''
                      }`}
                    placeholder="How can we help you?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  ></textarea>
                  {error && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <FaExclamationCircle className="mr-2" />
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending}
                    className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 ${sending ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                  >
                    {sending ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        Send message
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
