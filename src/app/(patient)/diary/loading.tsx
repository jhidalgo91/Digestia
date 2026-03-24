export default function DiaryLoading() {
    return (
        <main className="max-w-2xl mx-auto p-4">
            {/* Header skeleton */}
            <div className="mb-6">
                <div className="h-7 w-48 rounded bg-gray-200 animate-pulse mb-2" />
                <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
            </div>

            {/* Intake card skeletons — mismas dimensiones que IntakeCard real */}
            <div className="grid gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="p-3 border rounded h-24 bg-gray-50 animate-pulse flex flex-col justify-between"
                    >
                        <div className="flex justify-between">
                            <div>
                                <div className="h-4 w-24 rounded bg-gray-200 mb-1" />
                                <div className="h-3 w-40 rounded bg-gray-100" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 w-24 rounded bg-gray-200" />
                                <div className="h-8 w-20 rounded bg-gray-100" />
                            </div>
                        </div>
                        <div className="flex justify-between mt-2">
                            <div className="flex gap-2">
                                <div className="h-6 w-6 rounded-full bg-gray-200" />
                                <div className="h-6 w-6 rounded-full bg-gray-200" />
                                <div className="h-6 w-6 rounded-full bg-gray-200" />
                            </div>
                            <div className="h-3 w-20 rounded bg-gray-100" />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
