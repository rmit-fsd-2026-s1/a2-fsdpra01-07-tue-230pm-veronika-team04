"use client";

import {
  Avatar,
  Button,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuSeparator,
  MenuTrigger,
} from "@chakra-ui/react";
import {
  DialogActionTrigger,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/router";
import { useState } from "react";

export default function ProfileMenu() {

  // Simulated current user (replace with actual authentication logic)
  interface User {
    id: number;
    name: string;
    role: "hirer" | "freelancer";
  }

  const currentUser: User = {
    id: 1,
    name: "Alice",
    role: "hirer",
  };
  // Simulated current user (replace with actual authentication logic)

  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const displayName = currentUser?.name ?? "User";

  const handleConfirmLogout = () => {

    // add logout logic here
    // add logout logic here
    // add logout logic here

    toaster.create({
      title: "Logged out.",
      description: "You have been successfully logged out.",
      type: "success",
      duration: 2000,
    });
    setIsOpen(false);
    router.push("/");
  };

  return (
    <>
      <MenuRoot positioning={{ placement: "bottom-end" }}>
        <MenuTrigger asChild>
          <Button variant="ghost" rounded="full" _focusVisible={{ outline: "2px solid", outlineColor: "blue.500" }}>
            <Avatar.Root size="md" colorPalette="blue">
              <Avatar.Fallback name={displayName} bg="blue.500" color="white" />
            </Avatar.Root>
          </Button>
        </MenuTrigger>
        <MenuContent bg="white" borderColor="gray.200" boxShadow="md">
          <MenuItem value="profile" onClick={() => router.push("/profile")}>
            My Profile
          </MenuItem>
          <MenuItem value="notifications" onClick={() => router.push("/notifications")}>
            Notifications
          </MenuItem>
          <MenuItem value="settings" onClick={() => router.push("/settings")}>
            Settings
          </MenuItem>
          <MenuSeparator />
          <MenuItem value="logout" onClick={() => setIsOpen(true)} color="red.600">
            Logout
          </MenuItem>
        </MenuContent>
      </MenuRoot>

      <DialogRoot
        open={isOpen}
        onOpenChange={(e) => setIsOpen(e.open)}
        placement="center"
        role="alertdialog"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle fontSize="lg" fontWeight="bold">
              Confirm Logout
            </DialogTitle>
          </DialogHeader>
          <DialogBody>Are you sure you want to log out?</DialogBody>
          <DialogFooter gap={3}>
            <DialogActionTrigger asChild>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button colorPalette="red" onClick={handleConfirmLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
}