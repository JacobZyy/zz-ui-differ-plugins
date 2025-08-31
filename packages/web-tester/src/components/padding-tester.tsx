import './index.css'

export default function PaddingTester() {
  const array = Array.from({ length: 5 }).map((_, idx) => idx + 1)
  return (
    <div className="plugin-tester box-border w-sm flex flex-col p-4">
      <div className="pb-2">
        <div className="pl-1 text-6 font-400">padding测试</div>
        <div className="flex flex-wrap justify-between">
          {array.map(item => (
            <div key={item} className="test-item mb-xs box-border w-[48.8%] flex items-center justify-center rounded-lg bg-amber p-4 text-4 text-black font-300">
              第
              {item}
              项
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="pl-1 text-6 font-400">padding测试</div>
        <div className="flex flex-wrap justify-between">
          {array.map(item => (
            <div key={item} className="test-item mb-xs box-border w-[48.8%] flex items-center justify-center rounded-lg bg-amber p-4 text-4 text-black font-300">
              第
              {item}
              项
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
