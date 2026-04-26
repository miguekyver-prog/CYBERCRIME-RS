export default function TestCSS() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">CSS Test Page</h1>
        <p className="text-gray-600 mb-6">If you can see this with proper styling, Tailwind CSS is working!</p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-red-100 p-4 rounded-lg border-2 border-red-500">
            <h3 className="text-red-700 font-bold">Red Box</h3>
          </div>
          <div className="bg-green-100 p-4 rounded-lg border-2 border-green-500">
            <h3 className="text-green-700 font-bold">Green Box</h3>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-500">
            <h3 className="text-blue-700 font-bold">Blue Box</h3>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg border-2 border-yellow-500">
            <h3 className="text-yellow-700 font-bold">Yellow Box</h3>
          </div>
        </div>

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200">
          Test Button
        </button>
      </div>
    </div>
  );
}
