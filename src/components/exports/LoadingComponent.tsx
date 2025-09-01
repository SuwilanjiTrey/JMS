// Loading Component
const LoadingComponent = () => {
  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="animate-pulse space-y-4 sm:space-y-6">
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingComponent