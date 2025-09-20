"use client"

import * as React from "react"
import Link from "next/link"
import { FileText, Users, Settings, HelpCircle, BarChart3, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const features: { title: string; href: string; description: string; icon: React.ReactNode }[] = [
  {
    title: "Resume Parser",
    href: "/resume-parser",
    description: "Upload and parse resumes with AI-powered extraction of skills, experience, and qualifications.",
    icon: <FileText className="w-4 h-4" />
  },
  {
    title: "Job Matching",
    href: "/job-matching",
    description: "Match candidates to job descriptions using semantic analysis and LLM reasoning.",
    icon: <Users className="w-4 h-4" />
  },
  {
    title: "Analytics",
    href: "/analytics",
    description: "View detailed analytics and insights about your recruitment pipeline and candidate matches.",
    icon: <BarChart3 className="w-4 h-4" />
  },
  {
    title: "Settings",
    href: "/settings",
    description: "Configure your recruitment preferences and AI matching criteria.",
    icon: <Settings className="w-4 h-4" />
  },
]

export function NavigationMenuDemo() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <>
      {/* Desktop Navigation */}
      <NavigationMenu className="relative z-40 hidden md:block">
        <NavigationMenuList className="gap-6">
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-gray-700 hover:text-gray-900 bg-transparent">Products</NavigationMenuTrigger>
            <NavigationMenuContent className="z-50">
              <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px] p-4">
                {features.map((feature) => (
                  <ListItem
                    key={feature.title}
                    title={feature.title}
                    href={feature.href}
                    icon={feature.icon}
                  >
                    {feature.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-gray-700 hover:text-gray-900 bg-transparent">Solutions</NavigationMenuTrigger>
            <NavigationMenuContent className="z-50">
              <ul className="grid w-[300px] gap-4 p-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link href="/enterprise">
                      <div className="font-medium">Enterprise</div>
                      <div className="text-muted-foreground">
                        Scale your recruitment with enterprise features.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="/startups">
                      <div className="font-medium">Startups</div>
                      <div className="text-muted-foreground">
                        Perfect for growing companies.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="/agencies">
                      <div className="font-medium">Agencies</div>
                      <div className="text-muted-foreground">
                        Streamline your recruitment process.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 bg-transparent">About Us</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 bg-transparent">Pricing</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-gray-700 hover:text-gray-900 bg-transparent">Resources</NavigationMenuTrigger>
            <NavigationMenuContent className="z-50">
              <ul className="grid w-[200px] gap-4 p-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link href="/help" className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Help Center
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="/contact" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Contact Us
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden p-2"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h1 className="text-xl font-bold text-gray-900">RecurAI</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="p-4">
              <ul className="space-y-4">
                <li>
                  <Link href="/products" className="block text-gray-700 hover:text-gray-900 py-2">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/solutions" className="block text-gray-700 hover:text-gray-900 py-2">
                    Solutions
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="block text-gray-700 hover:text-gray-900 py-2">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="block text-gray-700 hover:text-gray-900 py-2">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="block text-gray-700 hover:text-gray-900 py-2">
                    Resources
                  </Link>
                </li>
              </ul>
              <div className="mt-8 space-y-3">
                <Link href="/sign-in" className="block">
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                    Login
                  </Button>
                </Link>
                <Link href="/demo" className="block">
                  <Button className="w-full bg-gray-900 text-white hover:bg-gray-800">
                    Request a Demo
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

function ListItem({
  title,
  children,
  href,
  icon,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { 
  href: string; 
  icon?: React.ReactNode;
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href} className="block p-3 rounded-md hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 text-sm leading-none font-medium">
            {icon}
            {title}
          </div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug mt-1">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
} 