/* eslint-disable @next/next/no-img-element */
"use client";

import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import CachedIcon from "@material-ui/icons/Cached";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import DeleteSweepIcon from "@material-ui/icons/DeleteSweep";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Theme, Tooltip, withStyles } from "@material-ui/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Vote } from "../../../interfaces/vote";
import VoteCard from "../../components/VoteCard";
import { APP, URLS } from "../../constants";
import VoteSelect from "@/components/VoteSelect";
import { Item } from "../../../interfaces/item";
import { posiblesVotes } from "@/data/selectVotes";
import { Snackbar } from "@mui/material";
import ReactConfetti from "react-confetti";
import { POKERBOARD_GREETING } from "@/utilities/greeting.utility";
import { ToastContainer, toast, ToastTransition } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Slide } from "react-toastify";
import TypewriterEffect from "@/components/TypewriterEffect";

export default function PockerBoard() {
  POKERBOARD_GREETING();
  const initialSelectVotes: Item[] = posiblesVotes;
  const [selectVotes, setSelectVotes] = useState<Item[]>(initialSelectVotes);
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room") || "";
  const [votes, setVotes] = useState<Vote[]>([]);
  const [value, setValue] = useState<number>(0);
  const [show, setShow] = useState<boolean>(false);
  const [showBy, setShowBy] = useState<string>("");
  const [showIAMessage, setShowIAMessage] = useState<boolean>(false);
  const socket = io(URLS.SOCKET, {
    query: { room: roomParam },
  });
  const router = useRouter();
  const [user, setUser] = useState<string>(
    typeof window !== "undefined"
      ? window.localStorage.getItem(APP.USER) || ""
      : ""
  );
  const LightTooltip = withStyles((theme: Theme) => ({
    tooltip: {
      backgroundColor: theme.palette.common.white,
      color: "black",
      fontSize: 14,
    },
  }))(Tooltip);
  const [openSnack, setOpenSnack] = useState<boolean>(false);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [confetti, setConfetti] = useState<boolean>(false);
  const [iaMessage, setIamessage] = useState<string>("");

  const handleSelect = (item: Item) => {
    const indexItem = selectVotes.findIndex((i) => i.value === item.value);
    const copyOfSelectVotes = [...selectVotes];
    copyOfSelectVotes.forEach((i) => (i.selected = false));
    copyOfSelectVotes[indexItem].selected = true;
    setSelectVotes(copyOfSelectVotes);
  };

  useEffect(() => {
    sendNewVote();
  }, [value]);

  useEffect(() => {
    if (showBy !== "") {
      setOpenSnack(true);
    }
  }, [showBy]);

  useEffect(() => {
    resetSelectVotes();
    initValidation();
    registerFirsVote();
    listenShow();
    listenValue();
    listenShowBy();
    listenIaMessage();
    return () => {
      socket.emit("logOut", user, roomParam);
      socket.off("votes");
    };
  }, []);

  const initalToastTest = () => {
    toast("JohnQ ingresó", {
      position: "bottom-left",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      transition: Slide,
      className: "toast",
    });
  };

  const listenShowBy = () => {
    let timeoutId!: any;

    socket.on("showBy", (userName) => {
      setShowLoader(false);
      setShowBy(userName);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        setShowBy("");
      }, 10000);
    });
  };

  const resetSelectVotes = () => {
    const copyOfSelectVotes = [...selectVotes];
    copyOfSelectVotes.forEach((i) => (i.selected = false));
    setSelectVotes(copyOfSelectVotes);
  };

  const listenValue = () => {
    socket.on("value", () => {
      setValue(0);
      unselectSelections();
      setShowLoader(false);
    });
  };

  const listenShow = () => {
    socket.on("show", (show: boolean) => {
      if (show) showConfetti();
      setShow(show);
      setShowIAMessage(show);
      setShowLoader(false);
    });
  };

  const listenIaMessage = () => {
    socket.on("iaMessage", (iaMessage: string) => {
      setIamessage(iaMessage);
    });
  };

  const initValidation = () => {
    if (user === "") {
      router.push("/selectUser?room=" + roomParam);
      return;
    }
    socket.on("roomHistory", (votes) => {
      setVotes(votes);
      setShowLoader(false);
    });
  };

  const registerFirsVote = () => {
    setShowLoader(true);
    const newVote: Vote = {
      user,
      value: 0,
    };
    socket.emit("newVote", newVote, roomParam);
    setShowLoader(true);
  };

  const sendNewVote = () => {
    setShowLoader(true);
    const newVote: Vote = {
      user,
      value: value,
    };
    socket.emit("newVote", newVote, roomParam);
    setShowLoader(true);
  };

  const leaveRoom = () => {
    logOut();
    router.push("/");
  };

  const changeUserName = () => {
    logOut();
    router.push("/selectUser?room=" + roomParam);
  };

  const logOut = () => {
    socket.emit("logOut", user, roomParam);
    localStorage.removeItem(APP.USER);
  };

  const showVotes = () => {
    socket.emit("setShow", roomParam, !show, user);
    setShowLoader(true);
  };

  const resetVotes = () => {
    socket.emit("resetValue", roomParam);
    socket.emit("resetVotes", roomParam);
    socket.emit("setShow", roomParam, false);
    setShowLoader(true);
  };

  const unselectSelections = () => {
    const copyOfSelectVotes = [...selectVotes];
    copyOfSelectVotes.forEach((i) => (i.selected = false));
    setSelectVotes(copyOfSelectVotes);
  };

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenSnack(false);
  };

  const showConfetti = () => {
    setConfetti(true);
    setShowIAMessage(true);
    setTimeout(() => {
      setConfetti(false);
    }, 5000);
  };

  return (
    <div className="fade-in">
      <div className="fixed top-3 right-12">
        {showLoader && (
          <Box sx={{ display: "flex", color: "black" }}>
            <CircularProgress
              color="inherit"
              size={20}
              className="dark:text-slate-300"
            />
          </Box>
        )}
      </div>
      <div className="flex justify-between p-2 pr-3 ">
        <div className="select-none cursor-none dark:text-slate-300 dark:hover:text-white">
          IA qpoker
        </div>
        <div onClick={leaveRoom}>
          <LightTooltip title="Salir de la sala" placement="left">
            <ExitToAppIcon className="cursor-pointer  dark:text-slate-300 dark:hover:text-white " />
          </LightTooltip>
        </div>
      </div>
      <div className="text-center py-4 font-bold text-4xl dark:text-slate-300">
        {user}
        <span onClick={changeUserName}>
          <LightTooltip title="cambiar nombre" placement="right">
            <CachedIcon
              fontSize="large"
              className="cursor-pointer pl-2 text-gray-400 hover:text-black  dark:text-gray-500 dark:hover:text-white "
            />
          </LightTooltip>
        </span>
      </div>
      <div className="flex gap-2 justify-center py-7 flex-wrap  w-[90%]  m-auto">
        {selectVotes.map((item, i) => (
          <VoteSelect
            key={i}
            setValue={setValue}
            item={item}
            setSelectVotes={setSelectVotes}
            selectVotes={selectVotes}
            handleSelect={handleSelect}
          />
        ))}
      </div>
      <div className="flex gap-2 flex-col pt-5 m-auto w-[90%] md:w-[60%] lg:w-[40%] text-lg font-bold ">
        <div className="relative">
          <div className=" absolute  -right-[1px] -top-[24px] text-right w-fit font-normal text-sm  text-gray-400 hover:text-black hover:underline cursor-pointer transition ">
            {show ? (
              <div
                onClick={showVotes}
                className="text-right w-full font-normal text-sm text-gray-400  dark:text-gray-500 dark:hover:text-white   hover:text-black hover:underline cursor-pointer transition"
              >
                Ocultar
                <VisibilityOffIcon className="ml-1" />
              </div>
            ) : (
              <div
                onClick={showVotes}
                className="text-right w-full font-normal text-sm text-gray-400 dark:text-gray-500  hover:text-black dark:hover:text-white hover:underline cursor-pointer transition"
              >
                Mostrar
                <VisibilityIcon className="ml-1" />
              </div>
            )}
          </div>
          <div
            onClick={showVotes}
            className=" absolute  right-12 -top-[28px] "
          ></div>
        </div>
        {votes.map((vote) => (
          <VoteCard key={vote.user} vote={vote} show={show} />
        ))}

        <div
          onClick={resetVotes}
          className="  dark:text-gray-500 dark:hover:text-white text-right w-full font-normal text-sm text-gray-400 hover:text-black hover:underline cursor-pointer transition"
        >
          Borrar Votos <DeleteSweepIcon />
        </div>
        {showIAMessage && (
          <div className="fixed bottom-4 left-0 right-0 text-center animate-[fadeIn_1s_ease-in-out]">
            <div className="inline-block px-6 py-3 rounded-lg bg-white/30 dark:bg-gray-800/30 shadow-lg max-w-[80%] transition-all duration-700 hover:bg-white hover:dark:bg-gray-800 relative animate-[slideUp_1s_ease-in-out]">
              <div className="flex justify-between items-start">
                <span
                  className={`text-gray-700/70 dark:text-gray-200/70 ${
                    window.innerWidth < 768 ? "text-base" : "text-xl"
                  } font-medium whitespace-pre-line hover:text-gray-700 hover:dark:text-gray-200 transition-all duration-700`}
                >
                  {iaMessage ? (
                    <TypewriterEffect key={iaMessage} text={iaMessage} />
                  ) : (
                    <span className="flex items-center gap-2">
                      <span
                        className="animate-pulse text-xl"
                        style={{ animationDuration: "2s" }}
                      >
                        ✨ Analizando votación...
                      </span>
                    </span>
                  )}
                </span>
                <button
                  onClick={() => {
                    const element = document.querySelector(".fixed");
                    element?.classList.add("animate-[fadeOut_1s_ease-in-out]");
                    setTimeout(() => setShowIAMessage(false), 1000);
                  }}
                  className="ml-2 mr-0 px-2 rounded-lg bg-gray-400/50 dark:bg-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-gray-400 hover:dark:bg-gray-600 flex items-center justify-center text-xl transition-all duration-700"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Snackbar
        open={openSnack}
        autoHideDuration={10000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <div className="mr-[20px] md:mr-[10px]  mt-[2px] md:mt-[-14px] bg-transparent dark:text-slate-300 text-gray-500 transition  italic px-4 font-thin text-sm">
          {showBy !== "" && ` ${showBy} ->`}{" "}
          {showBy !== "" && (
            <VisibilityOutlinedIcon className="text-gray-400" />
          )}
        </div>
      </Snackbar>
      {confetti && (
        <ReactConfetti
          initialVelocityY={{ min: 1, max: 3 }}
          numberOfPieces={100}
          recycle={false}
          gravity={0.2}
          style={{ width: "100%", height: "100vh" }}
        />
      )}
      <ToastContainer />
      {new Date().getMonth() === 11 && (
        <LightTooltip title={`🎅 ${user}, ¡Feliz Navidad! 🎄❤️`} placement="top">
          <div className="fixed bottom-0 left-0 m-4 hidden md:block cursor-none">
            <img
              src="https://images.vexels.com/media/users/3/341490/isolated/preview/25811322305e06cdd69facb1c0f7fdeb-a-rbol-de-navidad-sobre-un-fondo-verde.png"
              alt="Arbol de Navidad"
              className="w-24 h-24 opacity-80 hover:opacity-100 transition duration-300"
              style={{ filter: "hue-rotate(120deg)" }}
            />
          </div>
        </LightTooltip>
      )}
    </div>
  );
}
