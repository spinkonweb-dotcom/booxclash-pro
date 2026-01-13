const ComingSoon = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-600 to-orange-500 p-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-10 text-center max-w-md w-full border border-white/20">
        
        {/* Title */}
        <h1 className="text-3xl font-extrabold text-white mb-4 drop-shadow-md">
          🚀 Coming Soon!
        </h1>

        {/* Message */}
        <p className="text-white/90 text-lg mb-6 leading-relaxed">
          This feature is currently under development and will be available soon.
          <br />
          <span className="font-semibold">Stay tuned!</span>
        </p>

        {/* Animated Loader */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-purple-300 rounded-full animate-bounce delay-150" />
          <div className="w-3 h-3 bg-orange-300 rounded-full animate-bounce delay-300" />
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;