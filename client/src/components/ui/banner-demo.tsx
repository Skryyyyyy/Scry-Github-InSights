import { Banner } from "@/components/ui/banner"

function RainbowBannerDemo() {
  return (
    <div className="relative w-full">
      <Banner
        message="🎉 New features coming soon!"
        height="2rem"
        variant="rainbow"
        className="mb-4"
      />

      <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
          alt="Application screenshot"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

function BannerDemo() {
  return (
    <div className="relative w-full">
      <Banner
        message="🎉 New features coming soon!"
        height="2rem"
        className="mb-4"
      />

      <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
          alt="Application screenshot"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

export { RainbowBannerDemo, BannerDemo }
