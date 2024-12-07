"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CameraCapture } from "@/components/ui/cameraCapture";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FaceAnalysis {
  face_num: number;
  faces: number[][];
  point: [number, number][][];
}

interface FaceCutout {
  happy: string;
  frown: string;
  facepoints: {
    happy: number[][];
    frown: number[][];
  };
}

interface Replay {
  height: number;
  action: number;
}

interface Player {
  highScore: number;
  name: string;
  email: string;
  replay: Replay[];
  faceCutout: FaceCutout;
  sender: boolean;
  userId: string;
}

interface GameData {
  order_id: string;
  user_id: string;
  players: Player[];
  dueDate: string;
  groupName: string;
  senderEmail: string;
  finalImage: string;
  status: string;
  gameURL: string;
  gameType: string;
}

export default function RocketRunPage() {
  const [happyPhotoUrl, setHappyPhotoUrl] = useState<string | null>(null);
  const [sadPhotoUrl, setSadPhotoUrl] = useState<string | null>(null);
  const [happyFaceAnalysis, setHappyFaceAnalysis] = useState<FaceAnalysis | null>(null);
  const [sadFaceAnalysis, setSadFaceAnalysis] = useState<FaceAnalysis | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gameOrderId, setGameOrderId] = useState<string | null>(null);
  const [isReceiver, setReceiver] = useState(false);
  const [senderGameData, setSenderGameData] = useState<GameData | null>(null);

  useEffect(() => {
    setUserId(crypto.randomUUID());
    const query = new URLSearchParams(location.search);
    const urlOrderId = query.get("order_id");
    if (urlOrderId) {
      try {
        fetch("/api/get-rocket-run-game?order_id=" + urlOrderId, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }).then(async (response) => {
          if (!response.ok) throw new Error("Failed to fetch game");
          const result = await response.json();
          console.log(result);
          
          if (result.length) {
            setReceiver(true);
            setOrderId(urlOrderId);
            setSenderGameData(result[0].game_data);
          }
        });
      } catch (error) {
        console.error("Error getting game:", error);
      }
    } else {
      setOrderId(crypto.randomUUID());
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // Get form data
    const formData = new FormData(event.currentTarget);
    const name = formData.get("input1") as string;
    const email = formData.get("email") as string;
    const groupName = formData.get("groupName") as string;
    const dueDate = formData.get("dueDate") as string;
    const _playersData = {
      highScore: 0,
      name: name,
      email: email,
      replay: [],
      faceCutout: {
        happy: happyPhotoUrl || "",
        frown: sadPhotoUrl || "",
        facepoints: {
          happy: happyFaceAnalysis?.faces || [],
          frown: sadFaceAnalysis?.faces || [],
        },
      },
      sender: !isReceiver,
      userId: userId,
    }

    if(isReceiver && senderGameData){
      try {
        const updatedGameData = {...senderGameData};
        updatedGameData.players.push(_playersData);
        
        const gameData = {
          order_id: orderId,
          game_data: updatedGameData
        };
        const response = await fetch("/api/update-rocket-run-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gameData),
        });
  
        if (!response.ok) throw new Error("Failed to update game");
  
        const result = await response.json();
        setGameOrderId(result.order_id);
        setIsSuccessDialogOpen(true);
      } catch (error) {
        console.error("Error update game:", error);
      } finally {
        setIsLoading(false);
      }
    }else{
      const gameData = {
        order_id: orderId,
        user_id: userId,
        players: [_playersData],
        dueDate: dueDate,
        groupName: groupName || _playersData.name + "'s group",
        senderEmail: email,
        finalImage: "",
        status: "PREVIEW",
        gameURL: "",
        gameType: "rocket-run",
      };
      try {
        const response = await fetch("/api/create-rocket-run-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gameData),
        });
  
        if (!response.ok) throw new Error("Failed to create game");
  
        const result = await response.json();
        setGameOrderId(result.order_id);
        setIsSuccessDialogOpen(true);
      } catch (error) {
        console.error("Error creating game:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        <Card className="max-w-2xl mx-auto">
          <CardContent>
            <Image src="/RR-Hero.webp" alt="Whack-a-me main preview" width={800} height={320} className="w-full h-auto object-cover rounded-lg mt-6" />
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground text-center">
              Customize your game {
                isReceiver && senderGameData?.players ? 
                `(Joining ${senderGameData.players.find(item => item.sender)?.name} in ${senderGameData.groupName})` : 
                ""
              }
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Your Photo</Label>
                <CameraCapture
                  onPhotoCapture={(happyFile, sadFile, happyFaceAnalysis, sadFaceAnalysis) => {
                    console.log("happyFile", happyFile);
                    console.log("sadFile", sadFile);
                    setHappyPhotoUrl(happyFile);
                    setSadPhotoUrl(sadFile);
                    console.log("happyFaceAnalysis", happyFaceAnalysis);
                    console.log("sadFaceAnalysis", sadFaceAnalysis);
                    setHappyFaceAnalysis(happyFaceAnalysis as FaceAnalysis);
                    setSadFaceAnalysis(sadFaceAnalysis as FaceAnalysis);
                  }}
                  onError={() => console.error("Camera access error")}
                />
              </div>

              <div>
                <Label htmlFor="input1">Your nickname (This will be in the title of the game)</Label>
                <Input id="nickName" name="input1" placeholder="John" required />
              </div>

              <div>
                <Label htmlFor="email">Your email address</Label>
                <Input id="email" name="email" placeholder="someone@example.com" required />
              </div>
              <div style={{display: isReceiver? 'none': 'block'}}>
                <Label htmlFor="groupName">Your group name (Give a name to the group of your friends or family)</Label>
                <Input id="groupName" name="groupName" placeholder="John's Group"/>
              </div>

              <div style={{display: isReceiver? 'none': 'block'}}>
                <Label htmlFor="dueDate">Due date (To declare the winner)</Label>
                <Input id="dueDate" name="dueDate" type="date" defaultValue={new Date().toISOString().substr(0, 10)}></Input>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create!"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Created Successfully! 🎉</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Your game has been created successfully.</p>
            <Button asChild className="mt-2 w-full" variant="outline">
              <Link href={`https://games.pinenli.me/?order_id=${gameOrderId}`}>Try Now</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
