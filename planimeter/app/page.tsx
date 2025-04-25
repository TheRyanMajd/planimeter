import { Loader2 } from "lucide-react"
import { Suspense } from "react"
import ImageAnalyzer from "./analyzer"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-6 bg-gray-50">
      <header className="w-full max-w-md mb-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">Gen Z Planimeter</h1>
        <p className="text-center text-gray-600 mt-2">Made for Dr. Dillies Calc III Class</p>
      </header>

      <Suspense
        fallback={
          <div className="flex items-center justify-center w-full h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        }
      >
        <ImageAnalyzer />
      </Suspense>
      <footer className="w-full max-w-md mt-6 text-center text-gray-500">
        <p>Copyright © Ryan Majd<br></br>All rights reserved.</p>
      </footer>
    </main>

  )
}
